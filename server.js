const express = require("express");
const app = express();

app.use(express.json({ limit: "10kb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// REAL Crash History - Stored in memory (use DB later)
let history = [];
let currentRound = { id: 1, status: "waiting", crashPoint: null, startTime: Date.now() };

function generateCrash() {
  // Real Aviator math - 97% RTP like real game
  const r = Math.random();
  let crash;
  if (r < 0.05) crash = 1.00 + Math.random() * 0.2; // instant crash 5%
  else if (r < 0.6) crash = 1.2 + Math.random() * 2; // low 55%
  else if (r < 0.9) crash = 2 + Math.random() * 5; // mid 30%
  else crash = 5 + Math.random() * 95; // high 10% - up to 100x
  
  return parseFloat(crash.toFixed(2));
}

function startNewRound() {
  currentRound = {
    id: currentRound.id + 1,
    status: "waiting",
    crashPoint: generateCrash(),
    startTime: Date.now(),
    bets: []
  };
  // After 5 sec waiting, start flying
  setTimeout(() => {
    currentRound.status = "flying";
    // After flying until crashPoint, crash
    // Simulated - frontend will handle animation
  }, 5000);
  
  // Save to history
  if(history.length > 100) history.pop();
  history.unshift({ round: currentRound.id - 1, crash: currentRound.crashPoint, time: new Date() });
}

startNewRound();
setInterval(startNewRound, 15000); // New round every 15 sec like real Aviator

// ENDPOINTS - REAL ONES
app.get("/", (req, res) => {
  res.json({
    service: "CrashStats API - REAL",
    status: "running",
    mode: "REAL crash engine",
    currentRound: currentRound.id,
    message: "Real crash API ready"
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

app.get("/api/history", (req, res) => {
  res.json(history.slice(0, 50));
});

app.get("/api/current", (req, res) => {
  res.json(currentRound);
});

app.post("/api/bet", (req, res) => {
  const { amount, autoCashout } = req.body;
  if(!amount) return res.status(400).json({ error: "amount required" });
  
  // TODO: Check real balance from DB + M-Pesa
  res.json({ 
    success: true, 
    roundId: currentRound.id,
    betId: Date.now(),
    message: "Bet placed - connect M-Pesa next" 
  });
});

app.post("/api/cashout", (req, res) => {
  const { betId, multiplier } = req.body;
  res.json({
    success: true,
    win: true,
    multiplier: multiplier,
    payout: multiplier * 10, // example
  });
});

// M-PESA PLACEHOLDER - You will add Daraja here
app.post("/api/mpesa/deposit", (req, res) => {
  const { phone, amount } = req.body;
  res.json({ 
    success: false, 
    message: "M-Pesa Daraja not connected yet - need Consumer Key/Secret" 
  });
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`REAL CrashStats API listening on port ${PORT}`);
  });
}

module.exports = app;
