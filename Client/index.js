var StreamTweets = require('stream-tweets');
var request = require('request');
var credentials = require('./api-keys').twitterKeys;

var st = new StreamTweets(credentials);


st.stream('Trump', function(results){
    //console.log(results.body); 

    var text =  {
      'text': results.body,
      'model': 'en'
    };    

    var options = {
      url: 'http://127.0.0.1:8000/ent',
      headers : {"content-type": "application/json"},
      method: 'POST',
      json: true,
      body : text
    };
    
    request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body) // Print the shortened url.
      }
    });

});