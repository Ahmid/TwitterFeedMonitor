# TwitterFeedMonitor
This App monitors the entities (person names, place names) being mentioned in a Twitter feed and output a real-time tag cloud of the entity names being mentioned in the feed.

## Getting Started
The app is composed of three main nodes:
- **Client** : Acts as the Twitter client that streams the feed and sends each tweet to the named entity recognizer (NER) service.
- **NER Service** : Acts as the NER service that receives an API request to analyze a tweet and sends the tweet information to the report engine along with the detected entities.
- **Report Engine** : Acts as the report engine that receives a list of tweets + entities and displays a tag cloud visualization that updates in real-time.

## Client

### Description
The client is a Node.js script that pull the Twitter feed stream and send it over for NER analysis.

### How to install
- Create a **[Twitter APP](https://apps.twitter.com/)** with a name of your choice
- Create a file in the same repository with the name api-keys (/Client/api-keys)
- Download node.js from **[Node.JS Official Website](https://nodejs.org/en/download/)**
- Open a cmd, go to the client directory and run the following ``` npm install ```
- Insert the Twitter App Keys in the file with the below format:

```Javascript
module.exports.twitterKeys = {
    consumer_key :      'XXXXXX',
    consumer_secret :   'XXXXXX',
    token:              'XXXXXX',
    token_secret:       'XXXXXX'
};
```
- Modify the IP/PORT addresses as follows:

```Javascript
fetch('http://XX.XX.XX.XX:XXXX/ent', options)
```

Now the client part is ready to stream the twitter feeds, you can insert any word of your choice in the file index.js:
```Javascript
st.stream('YOUR_WORD', function(results){
  getEntities(results.body, 'en_core_web_sm');
});
```


## NER Service

### Description
A Python script that uses **[spaCy for NER](https://spacy.io/usage/linguistic-features#named-entities)**, exposed via **[spaCy's REST](https://github.com/explosion/spacy-services)** interface.

### How to install

- Download and install **[Python 3.6.X](https://www.python.org/downloads/)**
- Open a cmd, go to NERService directory, and run ```pip install -r requirments.txt```
- Modify the IP/Port numbers:

```Python
if __name__ == '__main__':
    es = Elasticsearch([{'host': 'localhost', 'port': 9200}])
    r = requests.get('http://localhost:9200')
    es.indices.delete(index='test_twitter', ignore=[400, 404])
    import waitress
    app = hug.API(__name__)
    app.http.add_middleware(CORSMiddleware(app))
    waitress.serve(__hug_wsgi__, port=8000)
   
```

## Report Engine

### Description
Elastic stack that ingest the spaCy output and display the tag cloud on a dashboard in Kibana

### How to install (Windows)
- Download and extract **[ElasticSearch](https://www.elastic.co/downloads/elasticsearch)**
- Download and extract **[Kibana](https://www.elastic.co/downloads/kibana)**
- Modify the file ```\elasticsearch-X.X.X\config\elasticsearch.yml``` and insert the IP and port numbers (the ones used in the spacy code).
- Run ```/bin/elasticsearch.bat```
- Modify ```\kibana-X.X.X-windows-x86_64\config\kibana.yml``` and uncomment line ```elasticsearch.url: "http://IP_ADDRESS:9200"```
- Run ```\kibana-X.X.X-windows-x86_64\bin\kibana.bat```

