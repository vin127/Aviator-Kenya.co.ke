const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({origin:'*'}));
app.use(express.json());

let currentRound = 1;

// REAL CRASH ENGINE
app.get('/', (req,res)=>{
  res.json({
    service:"CrashStats API - REAL",
    status:"running",
    mode:"REAL crash engine + STK Till 1833074",
    currentRound: currentRound++,
    minDeposit: 100,
    message:"LIVE Till 1833074 active Min 100"
  });
});

app.get('/api/round', (req,res)=>{
  const crash = (Math.random()*10 + 1.1).toFixed(2);
  res.json({round: currentRound++, crashPoint: parseFloat(crash), timestamp: Date.now()});
});

app.post('/api/stkpush', async (req,res)=>{
  try{
    let phone = (req.body.phone||'').toString().replace(/\D/g,'');
    if(phone.startsWith('0')) phone='254'+phone.slice(1);
    if(phone.startsWith('+')) phone=phone.slice(1);
    if(!phone.startsWith('254')) phone='254'+phone;
    
    let amount = parseInt(req.body.amount||100);
    if(amount < 100) return res.json({success:false, error:"Minimum deposit is 100 KES"});

    // TILL 1833074 HIDDEN - DO NOT SHOW IN FRONTEND
    const SHORTCODE='1833074';
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
        AccountReference:'FLYBET100',
        TransactionDesc:'Deposit 100'
      })
    });
    const stkData = await stkRes.json();
    console.log('STK SUCCESS Till 1833074 amount',amount,'to',phone,':', stkData);
    res.json({success:true, message:"STK sent to "+phone, data:stkData});
  }catch(e){
    console.error('STK ERROR:',e);
    res.json({success:false, error:e.message});
  }
});

app.post('/callback',(req,res)=>{
  console.log('MPESA CALLBACK:', JSON.stringify(req.body));
  res.json({ResultCode:0,ResultDesc:'ok'});
});

const PORT=process.env.PORT||10000;
app.listen(PORT,()=>console.log('LIVE Till 1833074 Min 100 on '+PORT));
