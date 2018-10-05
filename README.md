# TwitterFeedMonitor
This App monitors the entities (person names, place names, etc..) being mentioned in a Twitter feed and output a real-time tag cloud of the entity names being mentioned in the feed.
Mainly the app uses Node.js for twitter streaming, Python NER service for Named Entity Recognition and outputs the result to ad Kibana dashboard.

## Getting Started
The app is composed of three main nodes:
- **Client** (Node JS) : Acts as the Twitter client that streams the feed and sends each tweet to the named entity recognizer (NER) service.
- **NER Service** (Python): Acts as the NER service that receives an API request to analyze a tweet and sends the tweet information to the report engine along with the detected entities.
- **Report Engine** (Elastic search + Kibana): Acts as the report engine that receives a list of tweets + entities and displays a tag cloud visualization that updates in real-time.

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

Now you should be able to access the Kibana interface from the internet, run ```kubectl get services``` and copy the external IP address then paste it in the web browser adding the kibana 5601 port to it and hit enter (X.X.X.X:5601).

### NER Service

#### Description
A Python script that uses **[spaCy for NER](https://spacy.io/usage/linguistic-features#named-entities)**, exposed via **[spaCy's REST](https://github.com/explosion/spacy-services)** interface.

##### Deploying the app 
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


### Client

#### Description
The client is a Node.js script that pull the Twitter feed stream and send it over for NER analysis.

##### Deploying the app 
1. Create a **[Twitter APP](https://apps.twitter.com/)** with a name of your choice
2. Go to Client directory:
```bash
cd ../client
```
3. Create a file in the same repository with the name api-keys (/Client/api-keys)
4. Insert the Twitter App Keys in the file with the below format:

```Javascript
module.exports.twitterKeys = {
    consumer_key :      'XXXXXX',
    consumer_secret :   'XXXXXX',
    token:              'XXXXXX',
    token_secret:       'XXXXXX'
};
```
5. Run the command ```kubectl get endpoints``` and copy the IP Address of the ner-service service.
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


## Additional Info: Deploy a new version of your app
Kubernetes Engine's rolling update mechanism ensures that your application remains up and available even as the system replaces instances of your old container image with your new one across all the running replicas.

You can create an image for the v2 version of your application by building the same source code and tagging it as v2:
```bash
docker build -t gcr.io/YOUR_PROJECT_ID/client:v2 .
```

Then push the image to the Google Container Registry:
```bash
gcloud docker -- push gcr.io/YOUR_PROJECT_ID/client:v2
```

Now, apply a rolling update to the existing deployment with an image update:
```bash
kubectl set image deployment/client client=gcr.io/YOUR_PROJECT_ID/client:v2
```

## Deploying Kubernates locally
[Minikube](https://kubernetes.io/docs/getting-started-guides/minikube/) is used to run the app on local kubernates.

### Steps to deploy the app

1. Install hypervisor:
 - For OS X, install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) or [VMware Fusion](https://www.vmware.com/products/fusion.html), or [HyperKit](https://github.com/moby/hyperkit).
 - For Linux, install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) or [KVM](http://www.linux-kvm.org/).
 - For Windows, install [VirtualBox](https://www.virtualbox.org/wiki/Downloads) or [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/quick-start/enable-hyper-v).
2. Install [Kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
3. Install [Minikube](https://github.com/kubernetes/minikube/releases)
4. After installation, run the following command to start a kubernates cluster:
```bash
minikube start
```
5. Switch the kubectl context to use minikube
```bash
kubectl config use-context minikube
```
6. You can check the minikube dashboard using:
```bash
minikube dashboard
```
**Note**: It may take few minutes to initialize the cluster after running ```minikube start``` so dashboard might take some time to open.

7. Issue the command for building the image using the same Docker host as the Minikube VM:
```bash
eval $(minikube docker-env)
```
**Note**: Later, when you no longer wish to use the Minikube host, you can undo this change by running:
```bash
eval $(minikube docker-env -u)
```

In the rest of this instructions, the same configuration will be applied as the cloud ones but without pushing the docker into google.

## Report Engine:

1. Build the container image:
```bash 
docker build -t report-engine:v1 .
```
You can run ```docker images``` command to verify that the build was successful

2. Deploy the app:
```bash
kubectl run report-engine --image=report-engine:v1 --port 5601
```
To see the Pod created by the Deployment, run the following command:
```bash
kubectl get pods
```
3. Expose your application to the Internet:
```bash
kubectl expose deployment report-engine --type=LoadBalancer
```
The ```kubectl expose``` command above creates a Service resource, which provides networking and IP support to your application's Pods.
Run ```kubectl get service``` to check the networking properties assigned.

The ```--type=LoadBalancer``` flag indicates that you want to expose your Service outside of the cluster. On cloud providers that support load balancers, an external IP address would be provisioned to access the Service. On Minikube, the ```LoadBalancer``` type makes the Service accessible through the minikube service command.

```bash
minikube service report-engine
```
This automatically opens up a browser window using a local IP address that serves your app and shows the interface.

## NER Service
1. Run the command ```kubectl get endpoints``` and copy the **IP Address** of the report-engine endpoint.
2. Go to NER directory
```bash
cd ../NERService
```
3. Open app.py and edit the **```reportEngineIPAddress```** variable, paste the copied **IP Address** inside the qotations. Save the file.
4. Build the container image:
```bash 
docker build -t ner-service:v1 .
```
6. Deploy the app:
```bash
kubectl run ner-service --image=ner-service:v1 --port 8000
```
7. Expose your application:
```bash
kubectl expose deployment ner-service --type=LoadBalancer --port 80 --target-port 8000
```

## Client
1. Create a **[Twitter APP](https://apps.twitter.com/)** with a name of your choice
2. Go to Client directory:
```bash
cd ../client
```
3. Create a file in the same repository with the name api-keys (/Client/api-keys)
4. Insert the Twitter App Keys in the file with the below format:

```Javascript
module.exports.twitterKeys = {
    consumer_key :      'XXXXXX',
    consumer_secret :   'XXXXXX',
    token:              'XXXXXX',
    token_secret:       'XXXXXX'
};
```
5. Run the command ```kubectl get endpoints``` and copy the IP Address of the ner-service service.
6. Open index.js and edit the line: 
```Javascript
fetch('http://X.X.X.X:8000/ent', options)
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
docker build -t client:v1 .
```
9. Deploy the app:
```bash
kubectl run client --image=client:v1 --port 8000
```
10. Expose your application:
```bash
kubectl expose deployment client --type=LoadBalancer --port 80 --target-port 9200
```

**Updating the app**
1. Edit your index.js file to return new word result:
```Javascript
st.stream('YOUR_WORD', function(results){
  getEntities(results.body, 'en_core_web_sm');
});
```

2. Build a new version of your image (mind the trailing dot):
```
docker build -t client:v2 .
```

3. Update the image of your Deployment:
```
kubectl set image deployment/client client=client:v2
```

4.Run your app again to view the new message:
```
minikube service report-engine
```




