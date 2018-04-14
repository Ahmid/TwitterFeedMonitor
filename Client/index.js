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
  fetch('http://35.197.94.202:8000/ent', options)
       .then(res => res.json())
		.then(entities => {
          console.log(entities);
		});
      // .then(entities => {
      //     console.log(entities);
      // });
 }

 //st.stream('Javascript', function(results){
 // getEntities(results.body, 'en_core_web_sm');
 //});
 
 console.log ('I am running!');
 getEntities('Apple is looking at buying U.K. startup for $1 billion', 'en_core_web_sm');
 getEntities('I love javascript as well as Python !', 'en_core_web_sm');