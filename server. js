const express = require("express");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const JWT_SECRET = process.env.JWT_SECRET || "flybet-secret-change-me";
// TILL IS HIDDEN - Only in Render Environment, NOT in code, NOT on site
const TILL = process.env.MPESA_TILL || "";
const PASSKEY = process.env.MPESA_PASSKEY || "";
const C_KEY = process.env.MPESA_CONSUMER_KEY || "";
const C_SECRET = process.env.MPESA_CONSUMER_SECRET || "";
const ENV = process.env.MPESA_ENV || "sandbox";

let users = {};
let deposits = [];

function norm(p) {
  p = String(p || "").trim().replace(/\s/g, "");
  if (p.startsWith("+254")) return p;
  if (p.startsWith("254")) return "+" + p;
  if (p.startsWith("0")) return "+254" + p.slice(1);
  return p;
}
function valid(p) { return /^\+254[17]\d{8}$/.test(p); }

function auth(req, res, next) {
  const t = (req.headers.authorization || "").replace("Bearer ", "");
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch (e) { return res.status(401).json({ error: "Login first" }); }
}

// REGISTER - Password min 4
app.post("/api/register", async (req, res) => {
  let { username, phone, password } = req.body || {};
  phone = norm(phone);
  if (!username || !password) return res.status(400).json({ error: "Fill all fields" });
  if (String(password).length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  if (!valid(phone)) return res.status(400).json({ error: "Phone must be +2547... or +2541..." });
  if (users[phone]) return res.status(400).json({ error: "Phone already registered, login" });
  const h = await bcrypt.hash(password, 10);
  users[phone] = { phone, username, passHash: h, balance: 0, created: new Date() };
  res.json({ token: jwt.sign({ phone, username }, JWT_SECRET), username, phone, balance: 0 });
});

// LOGIN - Password min 4
app.post("/api/login", async (req, res) => {
  let { phone, password } = req.body || {};
  phone = norm(phone);
  if (!valid(phone)) return res.status(400).json({ error: "Use +254 phone" });
  if (!password || String(password).length < 4) return res.status(400).json({ error: "Password must be at least 4 characters" });
  const u = users[phone];
  if (!u) return res.status(400).json({ error: "No account, register" });
  if (!(await bcrypt.compare(password, u.passHash))) return res.status(400).json({ error: "Wrong password" });
  res.json({ token: jwt.sign({ phone, username: u.username }, JWT_SECRET), username: u.username, phone, balance: u.balance });
});

app.get("/api/me", auth, (req, res) => {
  const u = users[req.user.phone];
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({ username: u.username, phone: u.phone, balance: u.balance });
});

async function darajaToken() {
  const url = ENV === "production"
    ? "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    : "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";
  const r = await axios.get(url, { headers: { Authorization: "Basic " + Buffer.from(C_KEY + ":" + C_SECRET).toString("base64") } });
  return r.data.access_token;
}

// DEPOSIT - STK Push, Till hidden in backend only
app.post("/api/deposit", auth, async (req, res) => {
  let { amount, phone } = req.body || {};
  amount = parseInt(amount);
  phone = norm(phone || req.user.phone);
  if (!amount || amount < 100) return res.status(400).json({ error: "Min deposit 100" });
  if (!valid(phone)) return res.status(400).json({ error: "Invalid +254 phone" });
  if (!TILL || !PASSKEY) return res.status(500).json({ error: "Payment not configured, contact admin" });
  try {
    const token = await darajaToken();
    const ts = new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14);
    const pwd = Buffer.from(TILL + PASSKEY + ts).toString("base64");
    const base = ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke";
    const r = await axios.post(base + "/mpesa/stkpush/v1/processrequest", {
      BusinessShortCode: TILL,
      Password: pwd,
      Timestamp: ts,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: amount,
      PartyA: phone.replace("+", ""),
      PartyB: TILL,
      PhoneNumber: phone.replace("+", ""),
      CallBackURL: (process.env.BASE_URL || "https://aviator-kenya-co-ke-1.onrender.com") + "/api/mpesa/callback",
      AccountReference: "FLY BET",
      TransactionDesc: "FlyBet Deposit"
    }, { headers: { Authorization: "Bearer " + token } });
    deposits.unshift({ phone, amount, checkoutId: r.data.CheckoutRequestID, status: "PENDING", time: new Date() });
    res.json({ success: true, CheckoutRequestID: r.data.CheckoutRequestID });
  } catch (e) {
    console.log(e.response?.data || e.message);
    res.status(500).json({ error: "STK failed, check Daraja keys" });
  }
});

app.post("/api/mpesa/callback", (req, res) => {
  try {
    const cb = req.body.Body.stkCallback;
    const meta = cb.CallbackMetadata?.Item || [];
    const amt = meta.find(x => x.Name === "Amount")?.Value;
    const ph = "+" + meta.find(x => x.Name === "PhoneNumber")?.Value;
    if (cb.ResultCode === 0 && users[ph]) {
      users[ph].balance += amt;
      const d = deposits.find(x => x.checkoutId === cb.CheckoutRequestID);
      if (d) d.status = "PAID";
    }
    res.json({ ok: true });
  } catch (e) { res.json({ ok: true }); }
});

// ADMIN
app.post("/api/admin/login", (req, res) => {
  const { user, pass } = req.body || {};
  if (user === (process.env.ADMIN_USER || "admin") && pass === (process.env.ADMIN_PASS || "admin123")) {
    return res.json({ token: jwt.sign({ admin: true }, JWT_SECRET) });
  }
  res.status(400).json({ error: "Wrong admin" });
});
function adminAuth(req, res, next) {
  const t = (req.headers.authorization || "").replace("Bearer ", "");
  try { const d = jwt.verify(t, JWT_SECRET); if (!d.admin) throw 0; next(); }
  catch (e) { return res.status(401).json({ error: "Admin only" }); }
}
app.get("/api/admin/stats", adminAuth, (req, res) => {
  const all = Object.values(users);
  res.json({
    totalUsers: all.length,
    totalBalance: all.reduce((s, u) => s + u.balance, 0),
    totalDeposits: deposits.filter(d => d.status === "PAID").reduce((s, d) => s + d.amount, 0),
    pending: deposits.filter(d => d.status === "PENDING").length,
    users: all.map(u => ({ username: u.username, phone: u.phone, balance: u.balance, created: u.created })),
    deposits: deposits.slice(0, 50)
  });
});

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "index.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "admin.html")));
app.listen(process.env.PORT || 10000, () => console.log("FlyBet Live - Till Hidden"));
