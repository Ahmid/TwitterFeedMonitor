var StreamTweets = require('stream-tweets');
var credentials = require('./api-keys').twitterKeys;
 
var st = new StreamTweets(credentials);

st.stream('Javascript', function(results){
    console.log(results.body); 
});