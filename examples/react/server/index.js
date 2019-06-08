const express = require("express");
const MetaAuth = require("../../../index");
const cors = require("cors");
const bodyParser = require('body-parser')
const app = express();
const metaAuth = new MetaAuth();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())
app.use(cors());

app.get("/auth/:MetaAddress", metaAuth, (req, res) => {
  // Request a message from the server
  if (req.metaAuth && req.metaAuth.challenge) {
    res.send(req.metaAuth.challenge);
  }
});

app.get("/auth/:MetaMessage/:MetaSignature", metaAuth, async (req, res) => {
  if (req.metaAuth && req.metaAuth.recovered) {
    // Signature matches the cache address/challenge
 
    // Authentication is valid, assign JWT, etc.
    return res.status(200).send(req.metaAuth.recovered)
  } else {
    // Sig did not match, invalid authentication
    res.status(400).send();
  }
});

app.listen(3001, () => {
  console.log("Listening on port 3001");
});
