const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({origin:'*'}));
app.use(express.json());

let currentRound = 1;

// --- CRASH GAME ENGINE (keep old) ---
app.get('/', (req,res)=>{
  res.json({
    service:"CrashStats API - REAL",
    status:"running",
    mode:"REAL crash engine",
    currentRound: currentRound++,
    message:"Real crash API ready - Till 1833074 active"
  });
});

// --- STK PUSH WITH TILL 1833074 HIDDEN ---
app.post('/api/stkpush', async (req,res)=>{
  try{
    let phone = (req.body.phone||'').toString().replace(/\D/g,'');
    if(phone.startsWith('0')) phone='254'+phone.slice(1);
    if(phone.startsWith('+')) phone=phone.slice(1);
    const amount = parseInt(req.body.amount||50);
    
    const SHORTCODE='1833074'; // <-- YOUR NEW TILL HIDDEN HERE
    const PASSKEY='bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    const KEY='Lp1212jtFRAYec1dbph7tvPGnr4GLRS4Uzki4AjqDCMkXFZC';
    const SECRET='OanVgsGaOLq6fNPikNZGbF7OtJpU9G2uUaLMknd5TLlvhJTBeeg5px3te3ApP9pl';

    const auth = Buffer.from(`${KEY}:${SECRET}`).toString('base64');
    const tRes = await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{
      headers:{Authorization:`Basic ${auth}`}
    });
    const tData = await tRes.json();
    if(!tData.access_token) throw new Error(JSON.stringify(tData));
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
    const password = Buffer.from(SHORTCODE+PASSKEY+timestamp).toString('base64');
    
    const stkRes = await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{
      method:'POST',
      headers:{Authorization:`Bearer ${tData.access_token}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        BusinessShortCode:SHORTCODE,
        Password:password,
        Timestamp:timestamp,
        TransactionType:'CustomerBuyGoodsOnline',
        Amount:amount,
        PartyA:phone,
        PartyB:SHORTCODE,
        PhoneNumber:phone,
        CallBackURL:'https://crashstats-api.onrender.com/callback',
        AccountReference:'FLYBET',
        TransactionDesc:'Deposit'
      })
    });
    const stkData = await stkRes.json();
    console.log('STK to 1833074:', stkData);
    res.json({success:true, data:stkData});
  }catch(e){
    console.error(e);
    res.json({success:false, error:e.message});
  }
});

app.post('/callback',(req,res)=>{
  console.log('Callback:', JSON.stringify(req.body));
  res.json({ResultCode:0,ResultDesc:'ok'});
});

const PORT=process.env.PORT||10000;
app.listen(PORT,()=>console.log('LIVE Crash + Till 1833074 on '+PORT));
