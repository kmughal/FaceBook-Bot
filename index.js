const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');


const port = process.env.PORT || 3000;
const Q = require('q');

const app = express();
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("this is a test page only!");
});


// Facebook Webhook
// Used for verification
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



// All callbacks for Messenger will be POST-ed here
app.post("/webhook", function (req, res) {

  // Make sure this is a page subscription
  if (req.body.object == "page") {
    // Iterate over each entry
    // There may be multiple entries if batched
    req.body.entry.forEach(function (entry) {
      // Iterate over each messaging event

      entry.messaging.forEach(function (event) {
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

  console.log("senderId :", senderId);
  console.log("recipientid:", recipientId);
  console.log("timeofmessage:", timeOfMessage);
  console.log("message:", JSON.stringify(message))
  console.log("text:", message.text)
  if (message.text) {
   switch(message.text) {
     case 'generic' :
     sendGenericMessage(senderId);
     
     break;
     default :
       sendSimpleTextMessage(senderId, " Bot says thanks " + new Date() + " your message was : " + message.text);

   }
  }
}

// Send templated message

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
            item_url: "https://www.oculus.com/en-us/rift/",               
            image_url: "http://messengerdemo.parseapp.com/img/rift.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/rift/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "get_bus_detail",
            }],
          }, {
            title: "touch",
            subtitle: "Your Hands, Now in VR",
            item_url: "https://www.oculus.com/en-us/touch/",               
            image_url: "http://messengerdemo.parseapp.com/img/touch.png",
            buttons: [{
              type: "web_url",
              url: "https://www.oculus.com/en-us/touch/",
              title: "Open Web URL"
            }, {
              type: "postback",
              title: "Call Postback",
              payload: "Payload for second bubble",
            }]
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

        console.log("Successfully sent generic message with id %s to recipient %s",
          messageId, recipientId);
      } else {
        console.error("Unable to send message.");
        console.error(response.body.message);
        console.error(error);
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
  }, function (error, response, body) {
    console.log('error:', error);
    var bodyObj = JSON.parse(body);
    deferred.resolve(bodyObj.first_name);
  });

  return deferred.promise;
}

app.listen(port);