Simple webhook forwarder script to send webhooks from a hosted url to your local machine without hassle of setting up tunnels, or port forwarding your own machine, uses webhooks to communicate between client and server

### Why?
As opposed to using something like ngrok, this lets you use your own domain/server straight out of the box, which also means you can use the same url to test your webhooks locally while developing.

Also integrates directly into your express app and calls your post endpoints based on the webhook url that is hit, so you don't need to make any changes to your existing configuration

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
    if (process.env.NODE_ENV === 'Development')
        webhook_forwarder.client(server, 'secret-key') // replace 'secret-key' with your own
})
```


### Server Setup (Public endpoint for webhooks to come in)
Place this on a server, that can be accessed publicly (e.g. on somedomain.com or via ip), point your webhook to that server, and once you run the client your webhook endpoints will be hit 

```js
// index.js
const webhook_forwarder = require('webhook-simple-forwarder')
webhook_forwarder.server('secret-key', /*optional port, default: 3000 */) // replace 'secret-key' to match client
```

### What endpoints can I use?
Use the same endpoints that you have already. 

If you have a post endpoint called "wh/some-webhook" and your webhook forwarder server is located at `forward.exampledomain.com` your webhook url will be `forward.exampledomain.com:3000/wh/some-webhook`

This library supports unlimited endpoints.


### How to setup my server?
Any server with a public ip or domain will do, you could probably even use cloud functions for this


### Contributing & Issues
This package was made to fix a specific problem I had, therefore some features may be missing.

Feel free to open an issue or make a pull request.