
const express = require("express");

const app = express();

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
  res.json({
    service: "CrashStats API",
    status: "running",
    mode: "backend starter",
    message: "Server is reachable"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found"
  });
});

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CrashStats API listening on port ${PORT}`);
  });
}

module.exports = app;
