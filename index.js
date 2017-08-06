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
    let text = message.text;
    text = " Bot says thanks " + new Date() + " your message was : " + text;
    sendMessage(senderId, text);

  }
}


// sends message to user
function sendMessage(recipientId, message) {

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