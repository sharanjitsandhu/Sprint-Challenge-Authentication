const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../database/dbConfig");
const { authenticate } = require("../auth/authenticate");

module.exports = server => {
  server.post("/api/register", register);
  server.post("/api/login", login);
  server.get("/api/jokes", authenticate, getJokes);
};

// jsonwebtoken lib is used to produce a token
function generateToken(user) {
  const payload = {
    username: user.username
  };

  const secret = process.env.JWT_SECRET;

  const options = {
    expiresIn: "24h"
  };
  return jwt.sign(payload, secret, options); // returns asigned token
}

// Creates a user using the information sent inside the body of the request.
// Hash the password before saving the user to the database.
function register(req, res) {
  // implement user registration
  const user = req.body;
  const hash = bcrypt.hashSync(user.password, 10); //2^10 rounds
  // hash the password
  user.password = hash;
  db("users")
    .insert(user)
    .then(saved => {
      res.status(201).json(saved);
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

// Use the credentials sent inside the body to authenticate the user.
// If login fails, respond with the correct status code and the message: 'Invalid credentials!'
function login(req, res) {
  // implement user login
  const { username, password } = req.body;
  db("users")
    .first() // It won't show array by adding the first() method, instead we should only get one object
    .then(user => {
      if (username && bcrypt.compareSync(password, user.password)) {
        const token = generateToken(user);
        res.status(200).json({ message: `Welcome ${user.username}!`, token });
      } else {
        res.status(401).json({ message: "Invalid credentials!" });
      }
    })
    .catch(err => {
      res.status(500).json(err);
    });
}

function getJokes(req, res) {
  const requestOptions = {
    headers: { accept: "application/json" }
  };

  axios
    .get("https://icanhazdadjoke.com/search", requestOptions)
    .then(response => {
      res.status(200).json(response.data.results);
    })
    .catch(err => {
      res.status(500).json({ message: "Error Fetching Jokes", error: err });
    });
}
