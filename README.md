Simple webhook forwarder script to send webhooks from a hosted url to your local machine without hassle of setting up tunnels, or port forwarding your own machine, uses webhooks to communicate between client and server

### Installation
```js
npm i --save-dev webhook-simple-forwarder
```

### Client Setup (Where you want to receive webhooks)


```js
// index.js
const webhook_forwarder = require('webhook-simple-forwarder')

app.post('/wh/some-webhook', function(req, res) {
    console.log("Received Webhook!!")
    console.log(req.body)
    
    res.status(200).send("ok")
})

const server = app.listen(port, () => { 
    webhook_forwarder.client(server) 
})
```


### Server Setup (Public endpoint for webhooks to come in)
Place this on a server, that can be accessed publicly (e.g. on somedomain.com or via ip), point your webhook to that server, and once you run the client your webhook endpoints will be hit 

```js
// index.js
const webhook_forwarder = require('webhook-simple-forwarder')
webhook_forwarder.server() // can pass port if needed, defaults to 3000
```