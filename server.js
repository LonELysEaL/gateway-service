const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const AUTH_URL = "https://auth-service-production-e7ae.up.railway.app";

const MAIN_URL = "https://tiktokchat-production.up.railway.app";

app.get("/", (req, res) => {
  res.send("Gateway Running");
});

async function checkAuth(req, res, next) {

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send("No Token");
  }

  try {

    const auth = await axios.get(
      AUTH_URL + "/verify",
      {
        headers: {
          authorization: token
        }
      }
    );

    if (!auth.data.valid) {
      return res.status(401).send("Invalid Token");
    }

    req.user = auth.data.user;

    next();

  } catch (err) {

    console.log(err.message);

    return res.status(500).send("Auth Error");
  }
}

app.get("/protected", checkAuth, (req, res) => {

  res.json({
    success: true,
    user: req.user
  });

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Gateway running");
});