// server.js - Aviator Kenya - Daraja Production STK Push
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// ===== DARAJA - READ FROM RENDER ENVIRONMENT =====
// On Render you must have:
// MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_PASSKEY, MPESA_SHORTCODE=1364630
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE || "1364630";
const CALLBACK_URL = "https://aviator-kenya-co-ke.onrender.com/mpesa/callback";

// ===== GAME STATE =====
let balance = 0;
let currentRound = 2;
let deposits = {}; // { checkoutRequestID: { phone, amount, status } }

// ===== HELPERS =====
function getTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return ${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())};
}

async function getAccessToken() {
  const auth = Buffer.from(${CONSUMER_KEY}:${CONSUMER_SECRET}).toString('base64');
  const res = await axios.get('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
    headers: { Authorization: Basic ${auth} }
  });
  return res.data.access_token;
}

// ===== ROUTES =====
app.get('/', (req, res) => {
  res.json({
    service: "CrashStats API - REAL",
    status: "running",
    mode: REAL crash engine + Daraja STK ${SHORTCODE},
    currentRound,
    minDeposit: 100,
    message: LIVE Daraja ${SHORTCODE} active Min 100
  });
});

// 1. DEPOSIT - Triggers STK Push
app.post('/deposit', async (req, res) => {
  try {
    let { phone, amount } = req.body;
    amount = Number(amount);
    if (!phone || !amount || amount < 100) {
      return res.status(400).json({ success: false, message: "Min deposit 100, phone required" });
    }
    // Format phone: 072... -> 25472...
    phone = String(phone).replace(/\s/g, '');
    if (phone.startsWith('0')) phone = '254' + phone.slice(1);
    if (phone.startsWith('+')) phone = phone.slice(1);

    const timestamp = getTimestamp();
    const password = Buffer.from(${SHORTCODE}${PASSKEY}${timestamp}).toString('base64');
    const token = await getAccessToken();

    const stkRes = await axios.post('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
      BusinessShortCode: SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: phone,
      PartyB: SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: CALLBACK_URL,
      AccountReference: "AviatorKE",
      TransactionDesc: "Aviator Deposit"
    }, { headers: { Authorization: Bearer ${token} } });

    const checkoutID = stkRes.data.CheckoutRequestID;
    deposits[checkoutID] = { phone, amount, status: "PENDING" };
