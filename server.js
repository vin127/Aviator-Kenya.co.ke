const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors({origin:'*'}));
app.use(express.json());
app.use(express.static('.'));

const SHORTCODE='1364630';
const PASSKEY='bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
const KEY='Lp1212jtFRAYec1dbph7tvPGnr4GLRS4Uzki4AjqDCMkXFZC';
const SECRET='OanVgsGaOLq6fNPikNZGbF7OtJpU9G2uUaLMknd5TLlvhJTBeeg5px3te3ApP9pl';

app.post('/api/stkpush', async(req,res)=>{
 let p=req.body.phone; let a=req.body.amount;
 if(p.startsWith('0')) p='254'+p.slice(1);
 const auth=Buffer.from(`${KEY}:${SECRET}`).toString('base64');
 const t=await fetch('https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',{headers:{Authorization:`Basic ${auth}`}});
 const td=await t.json();
 const ts=new Date().toISOString().replace(/[^0-9]/g,'').slice(0,14);
 const pw=Buffer.from(SHORTCODE+PASSKEY+ts).toString('base64');
 const r=await fetch('https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',{method:'POST',headers:{Authorization:`Bearer ${td.access_token}`,'Content-Type':'application/json'},body:JSON.stringify({BusinessShortCode:SHORTCODE,Password:pw,Timestamp:ts,TransactionType:'CustomerBuyGoodsOnline',Amount:Math.round(a),PartyA:p,PartyB:SHORTCODE,PhoneNumber:p,CallBackURL:`https://${req.get('host')}/callback`,AccountReference:'FLYBET',TransactionDesc:'Deposit'})});
 const d=await r.json(); res.json({success:true,data:d});
});
app.post('/callback',(req,res)=>res.json({ResultCode:0}));
app.listen(process.env.PORT||10000,()=>console.log('Till 1364630 LIVE'));
