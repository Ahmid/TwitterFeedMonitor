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
  fetch('http://127.0.0.1:8000/ent', options)
      .then(res => res.json())
      // .then(entities => {
      //     console.log(entities);
      // });
}

 st.stream('Lebanon', function(results){
  getEntities(results.body, 'en_core_web_sm');
 });