const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const Q = require('q');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(bodyParser.json());


app.get("/", (req, res) => {
  res.send("Hello World !");
});

app.get("/webhook",
  (req, res) => {
    if (req.query["hub.verify_token"] === "this_is_my_token") {
      console.log("Verified webhook");
      res.status(200).send(req.query["hub.challenge"]);
    } else {
      console.error("Verification failed. The tokens do not match.");
      res.sendStatus(403);
    }
  });




app.post("/webhook", function (req, res) {
  if (req.body.object == "page") {
    
    req.body.entry.forEach(function (entry) {
      entry.messaging.forEach(function (event) {
        
        if (event.postback) {
           getPostBack(event);
        } else {
        processMessage(event);
        }
      });
    });

    res.sendStatus(200);
  }
});

function getPostBack(event){
   var senderId = event.sender.id;
  var recipientId = event.recipient.id;
      sendSimpleTextMessage(senderId,"pay load message receive");
}

function processMessage(event) {
  var senderId = event.sender.id;
  var recipientId = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;
  
  if(!message)
    return;
  
  if (event.postback){
    getPostBack(event);
  }
  else {
   switch(message.text) {
     case 'generic' :
     sendGenericMessage(senderId);
     
     break;
     default :
       sendSimpleTextMessage(senderId, " Bot says thanks " + new Date() + " your message was : " + message.text);

   }
  }
}


function sendGenericMessage(recipientId) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      attachment: {
        type: "template",
        payload: {
          template_type: "generic",
          elements: [{
            title: "Bus arrival time",
            subtitle: "You can know the bus arrival time",
            item_url: "http://www.freeimageslive.com",               
            image_url: "http://www.freeimageslive.com/galleries/workplace/education/pics/aeiou.jpg",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Test Post Back",
              payload: "get_bus_detail"
            }],
          }]
        }
      }
    }
  };  

  callApi(messageData);
}

// Send normal text message.
function sendSimpleTextMessage(recipientId, message) {

  var profilePromise = getUserProfile(recipientId).then((fn) => {

    message = 'Hi ' + fn + message;
    console.log("sending message", message)

    var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: message
    }
  };
   callApi(messageData);
  });
}

function callApi(messageData){
   request({
      url: "https://graph.facebook.com/v2.6/me/messages",
      qs: {
        access_token: process.env.PAGE_ACCESS_TOKEN
      },
      method: "POST",
      json: messageData
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var recipientId = body.recipient_id;
        var messageId = body.message_id;
      } else {
        console.error("Unable to send message.");
      }
    });
}

function getUserProfile(senderId) {
  var deferred = Q.defer();

  request({
    url: "https://graph.facebook.com/v2.6/" + senderId,
    qs: {
      access_token: process.env.PAGE_ACCESS_TOKEN,
      fields: "first_name"
    },
    method: "GET"
  },  (error, response, body) => {
    console.log('error:', error);
    var bodyObj = JSON.parse(body);
    deferred.resolve(bodyObj.first_name);
  });

  return deferred.promise;
}

app.listen(port);