const fetch = require("node-fetch");
var StreamTweets = require('stream-tweets');
var request = require('request');
var credentials = require('./api-keys').twitterKeys;


var st = new StreamTweets(credentials);

function getEntities(text, model) {
  const options = {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ text, model })
  };
  fetch('http://10.0.1.6:8000/ent', options)
       .then(res => res.json())
		.then(entities => {
          console.log(entities);
		});
      // .then(entities => {
      //     console.log(entities);
      // });
 }

 // st.stream('javascript', function(results){
  // getEntities(results.body, 'en_core_web_sm');
 // });
 
 console.log ('I am running!');
var currentdate = new Date(); 
var datetime = "Last Sync: " + currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " @ "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();
console.log (datetime);
 // getEntities('Apple is looking at buying U.K. startup for $1 billion', 'en_core_web_sm');
 // getEntities('I love javascript as well as Python !', 'en_core_web_sm');