# TwitterFeedMonitor
This App monitors the entities (person names, place names, etc..) being mentioned in a Twitter feed and output a real-time tag cloud of the entity names being mentioned in the feed.

## Getting Started
The app is composed of three main nodes:
- **Client** : Acts as the Twitter client that streams the feed and sends each tweet to the named entity recognizer (NER) service.
- **NER Service** : Acts as the NER service that receives an API request to analyze a tweet and sends the tweet information to the report engine along with the detected entities.
- **Report Engine** : Acts as the report engine that receives a list of tweets + entities and displays a tag cloud visualization that updates in real-time.

This will be implemented inside **Docker** containers and orchestrated by **Kuberentes** using **Google Cloud Platform**.

## Before you begin
### Take the following steps to enable the Kubernetes Engine API:
1. Visit the [Kubernetes Engine page](https://console.cloud.google.com/projectselector/kubernetes?_ga=2.118272329.-1974524917.1523519102) in the Google Cloud Platform Console.
2. Create or select a project.
3. Wait for the API and related services to be enabled. This can take several minutes.
4. Make sure that [billing](https://cloud.google.com/billing/docs/how-to/modify-project) is enabled for your project. 

### Enabling command-line tools locally:
1. Install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/quickstarts), which includes the `gcloud` command-line tool.
2. Using the `gcloud` command line tool, install the [Kubernetes](https://kubernetes.io/) command-line tool. `kubectl` is used to communicate with Kubernetes, which is the cluster orchestration system of Kubernetes Engine clusters:
       
       gcloud components install kubectl
3. Install [Docker Community Edition (CE)](https://docs.docker.com/install/) on your workstation. You will use this to build a container image for the application.


## Preparing the API

#### Step 1: Set Default Configuration
To save time typing your [project ID](https://support.google.com/cloud/answer/6158840) and [Compute Engine zone](https://cloud.google.com/compute/docs/regions-zones/#available) options in the gcloud command-line tool, you can set default configuration values by running the following commands:
       
 ```bash
gcloud config set project [PROJECT_ID]
gcloud config set compute/zone us-central1-b
  ```
      
       
#### Step 2: Creating a Kubernetes Engine cluster
A cluster consists of at least one cluster master machine and multiple worker machines called nodes. Nodes are Compute Engine virtual machine (VM) instances that run the Kubernetes processes necessary to make them part of the cluster. You deploy applications to clusters, and the applications run on the nodes.

To create a cluster, run the following command:
```bash       
gcloud container clusters create [CLUSTER_NAME]
```
where ```[CLUSTER_NAME]``` is the name you choose for the cluster.
***Note:*** It might take several minutes to finish creating the cluster.

#### Step3: Get authentication credentials for the cluster
After creating your cluster, you need to get authentication credentials to interact with the cluster.
To authenticate for the cluster, run the following command:
```bash
gcloud container clusters get-credentials [CLUSTER_NAME]
```

## Deploying the nodes


### Report Engine

#### Description
Elastic stack that ingest the spaCy output and display the tag cloud on a dashboard in Kibana

#### Deploying the app
1. Go to report engine directory:
```bash
cd ReportEngine
```
2. Build the container image:
```bash 
docker build -t gcr.io/YOUR_PROJECT_ID/report-engine:v1 .
```
You can run ```docker images``` command to verify that the build was successful

3. Upload the container image:
```bash
gcloud docker -- push gcr.io/YOUR_PROJECT_ID/report-engine:v1
```
4. Deploy the app:
```bash
kubectl run report-engine --image=gcr.io/YOUR_PROJECT_ID/report-engine:v1 --port 5601
```
To see the Pod created by the Deployment, run the following command:
```bash
kubectl get pods
```
5. Expose your application to the Internet:
```bash
kubectl expose deployment report-engine --type=LoadBalancer
```
The ```kubectl expose``` command above creates a Service resource, which provides networking and IP support to your application's Pods.
Run ```kubectl get service``` to check the networking properties assigned.

6. Expose ports in YAML file:
As the ```kubectl expose``` command allows only to expose one port, and the report engine image runs on two ports (5601 for Kibana and 9200 for Elasticsearch), then you should manually add the second port in the condiguration file.
- Open google cloud platform 
- Go to Kubernates Engine -> Workloads
- Click on **report-engine** workload -> YAML 
- Click Edit 
- Add the following under containers:
```YAML
ports:
        - containerPort: 5601
          name: kibana
          protocol: TCP
        - containerPort: 9200
          name: elastic
          protocol: TCP
```

Now you should be able to access the Kibana interface from the internet, run ```kubectl get services``` and copy the external IP address then paste it in the web browser adding the kibana 5601 port to it and hit enter (XXX.XXX.XXX.XXX:5601).

## NER Service

### Description
A Python script that uses **[spaCy for NER](https://spacy.io/usage/linguistic-features#named-entities)**, exposed via **[spaCy's REST](https://github.com/explosion/spacy-services)** interface.

#### Deploying the app 
1. Run the command ```kubectl get endpoints``` and copy the **IP Address** of the report-engine endpoint.
2. Go to NER directory
```bash
cd ../NERService
```
3. Open app.py and edit the **```reportEngineIPAddress```** variable, paste the copied **IP Address** inside the qotations. Save the file.
4. Build the container image:
```bash 
docker build -t gcr.io/YOUR_PROJECT_ID/ner-service:v1 .
```
5. Upload the container image:
```bash
gcloud docker -- push gcr.io/YOUR_PROJECT_ID/ner-service:v1
```
6. Deploy the app:
```bash
kubectl run ner-service --image=gcr.io/YOUR_PROJECT_ID/ner-service:v1 --port 8000
```
7. Expose your application:
```bash
kubectl expose deployment ner-service --type=LoadBalancer --port 80 --target-port 8000
```


## Client

### Description
The client is a Node.js script that pull the Twitter feed stream and send it over for NER analysis.

#### Deploying the app 
1. Create a **[Twitter APP](https://apps.twitter.com/)** with a name of your choice
2. Create a file in the same repository with the name api-keys (/Client/api-keys)
3. Insert the Twitter App Keys in the file with the below format:

```Javascript
module.exports.twitterKeys = {
    consumer_key :      'XXXXXX',
    consumer_secret :   'XXXXXX',
    token:              'XXXXXX',
    token_secret:       'XXXXXX'
};
```
4. Run the command ```kubectl get endpoints``` and copy the IP Address of the ner-service service.
5. Go to client directpry
```bash
cd ../Client
```
6. Open index.js and edit the line: 
```Javascript
fetch('http://XX.XX.XX.XX:8000/ent', options)
```
paste the copied IP address inside the qotations. Save the file.

7. Insert any word of your choice to get the tweets feed in the file index.js:
```Javascript
st.stream('YOUR_WORD', function(results){
  getEntities(results.body, 'en_core_web_sm');
});
```
8. Build the container image:
```bash 
docker build -t gcr.io/YOUR_PROJECT_ID/client:v1 .
```
9. Upload the container image:
```bash
gcloud docker -- push gcr.io/YOUR_PROJECT_ID/client:v1
```
10. Deploy the app:
```bash
kubectl run client --image=gcr.io/YOUR_PROJECT_ID/client:v1 --port 8000
```
11. Expose your application:
```bash
kubectl expose deployment client --type=LoadBalancer --port 80 --target-port 9200
```







