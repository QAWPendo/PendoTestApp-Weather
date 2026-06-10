console.log("hello world");

const express = require("express");

const router = express.Router();
const startTime = Date.now();

router.get("/", (_req, res) => {
  res.json({
    status: "ok",
    uptime: Math.round((Date.now() - startTime) / 100) / 10,
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

module.exports = router;
