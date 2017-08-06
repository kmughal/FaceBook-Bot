const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');


const port =  process.env.PORT || 3000;

const app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get("/",(req,res)=> {
    res.send("this is a test page only!");
});


// Facebook Webhook
// Used for verification
app.get("/webhook", 
(req,res) => {
   if (req.query["hub.verify_token"] === "this_is_my_token") {
    console.log("Verified webhook");
    res.status(200).send(req.query["hub.challenge"]);
  } else {
    console.error("Verification failed. The tokens do not match.");
    res.sendStatus(403);
  } 
});



// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {
  
  // Make sure this is a page subscription
  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function(entry) {
      // Iterate over each messaging event
      
      entry.messaging.forEach(function(event) {
          processMessage(event);
      });
    });

    res.sendStatus(200);
  }
});

function processMessage(event) {
    var senderId = event.sender.id;
    var recipientId = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;
    
    console.log("senderId :" , senderId);
    console.log("recipientid:" , recipientId);
    console.log("timeofmessage:" , timeOfMessage);
    console.log("message:" ,JSON.stringify(message))
    console.log("text:" , message.text)
    if(message.text) {
        let text = message.text;
        text = "Bot says thanks " + new Date() + " your message was : " + text;
        //transmitMessage(senderId,recipientId,text);
         sendMessage(senderId, {text: text});
    }
}



function transmitMessage(senderId,recipientId,text){
      request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN,
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
        
      var greeting = "";
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        greeting = "Hi " + name + ". ";
      }
      var message = greeting + text;
      sendMessage(senderId, {text: message});
    });
}

// function processPostback(event) {
//  console.log("event : " , event);
//   var senderId = event.sender.id;
//   var payload = event.postback.payload || 'great';

//   if (payload === "Greeting") 
//     {
//     // Get user's first name from the User Profile API
//     // and include it in the greeting
//     request({
//       url: "https://graph.facebook.com/v2.6/" + senderId,
//       qs: {
//         access_token: process.env.PAGE_ACCESS_TOKEN,
//         fields: "first_name"
//       },
//       method: "GET"
//     }, function(error, response, body) {
//       var greeting = "";
//       if (error) {
//         console.log("Error getting user's name: " +  error);
//       } else {
//         var bodyObj = JSON.parse(body);
//         name = bodyObj.first_name;
//         greeting = "Hi " + name + ". ";
//       }
//       var message = greeting + "My name is SP Movie Bot. I can tell you various details regarding movies. What movie would you like to know about?";
//       sendMessage(senderId, {text: message});
//     });
//   }
// }

// sends message to user
function sendMessage(recipientId, message) {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipientId},
      message: message,
    }
  }, function(error, response, body) {
    if (error) {
      console.log("Error sending message: " + response.error);
    }
  });
}

app.listen(port);