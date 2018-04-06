# TwitterFeedMonitor
This App monitors the entities (person names, place names) being mentioned in a Twitter feed and output a real-time tag cloud of the entity names being mentioned in the feed.

## Getting Started
The app is composed of three main nodes:
- **Client** : Acts as the Twitter client that streams the feed and sends each tweet to the named entity recognizer (NER) service.
- **NER Service** : Acts as the NER service that receives an API request to analyze a tweet and sends the tweet information to the report engine along with the detected entities.
- **Report Engine** : Acts as the report engine that receives a list of tweets + entities and displays a tag cloud visualization that updates in real-time.

