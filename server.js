const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.json({
    status: "ok",
    message: "AI Video Backend Ready"
  });
});

app.get("/test-api-key", (req, res) => {
  res.json({
    status: process.env.MAGIC_HOUR_API_KEY ? "API key connected" : "API key missing"
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
