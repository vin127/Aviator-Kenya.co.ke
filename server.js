const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// TILL 1364630 HIDDEN HERE
const CONSUMER_KEY = 'Lp1212jtFRAYec1dbph7tvPGnr4GLRS4Uzki4AjqDCMkXFZC';
const CONSUMER_SECRET = 'OanVgsGaOLq6fNPikNZGbF7OtJpU9G2uUaLMknd5TLlvhJTBeeg5px3te3ApP9pl';
const PASSKEY = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const SHORTCODE = '1364630';

app.post('/api/stkpush', async (req,res)=>{
  const {phone, amount} = req.body;
  let formatted = phone.startsWith('0') ? '254'+phone.slice(1) : phone;
  try{
    const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
    const tokenRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:`Basic ${auth}`}});
    const tokenData = await tokenRes.json();
    const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
    const password = Buffer.from(SHORTCODE+PASSKEY+timestamp).toString('base64');
    const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{
      method:'POST',
      headers:{Authorization:`Bearer ${tokenData.access_token}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        BusinessShortCode:SHORTCODE,Password:password,Timestamp:timestamp,
        TransactionType:'CustomerBuyGoodsOnline',Amount:Math.round(amount),
        PartyA:formatted,PartyB:SHORTCODE,PhoneNumber:formatted,
        CallBackURL:'https://your-render.onrender.com/callback',
        AccountReference:'FLYBET',TransactionDesc:'Deposit'
      })
    });
    const data = await stkRes.json();
    res.json({success:true,data});
  }catch(e){res.status(500).json({success:false,error:e.message})}
});

app.listen(10000,()=>console.log('Till 1364630 server live on Render'));
