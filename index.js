const express = require('express');
const bodyParser = require('body-parser');
const port =  process.env.PORT || 3000;

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get("/",(req,res)=> {
    if (req.query["hub.verify_token"] === "this_is_my_token") {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    res.send("hello world" +  new Date());
  } 
    
});


// Facebook Webhook
// Used for verification
app.get("/webhook", 
(req,res) => {
    console.log("webhook call .... " , req.query);
   if (req.query["hub.verify_token"] === "this_is_my_token") {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  } 
});

app.listen(port);