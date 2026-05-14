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

app.get("/test-protected", (req, res) => {

  res.send(`

    <h2>Test Protected Route</h2>

    <textarea id="token"
      rows="10"
      cols="80"></textarea>

    <br><br>

    <button onclick="test()">
      TEST PROTECTED
    </button>

    <pre id="result"></pre>

    <script>

      async function test() {

        const token =
          document.getElementById('token').value;

        const response = await fetch('/protected', {
          headers: {
            authorization: token
          }
        });

        const text = await response.text();

        document.getElementById('result').innerText =
          text;
      }

    </script>

  `);

});

app.use(checkAuth);

app.use(async (req, res) => {

  console.log("FORWARD →", req.method, req.originalUrl);
  // ❌ กัน route ที่ไม่ต้องส่งไป main
  if (
    req.path === "/" ||
    req.path === "/test-protected" ||
    req.path === "/protected"
  ) {
    return res.status(404).send("Not for forward");
  }

  try {

    const response = await axios({
      method: req.method,
      url: MAIN_URL + req.originalUrl,
      headers: {
        "Content-Type": "application/json"
      },
      data: req.body
    });

    res.send(response.data);

  } catch (err) {
    console.log(err.message);
    res.status(500).send("Forward Error");
  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Gateway running");
});
