const express   = require('express')
const WebSocket = require('ws');
const axios     = require('axios');
var jwt         = require('jsonwebtoken')

module.exports =
{
    server: function(secret, port = 3000)
    {
        if (!secret)
        {
            console.error("Incorrect Usage")
            return
        }

        if (secret === 'secret-key')
        {
            console.warn("!! Using default signing key, replace 'secret-key' with your own key")
            return
        }

        const app = express()
        const wss = new WebSocket.WebSocketServer({
            noServer: true,
            verifyClient: function (info, cb) {
                var token = info.req.headers.token
                if (!token)
                    cb(false, 401, 'Unauthorized')
                else {
                    jwt.verify(token, secret, function (err, decoded) {
                        if (err) {
                            cb(false, 401, 'Unauthorized')
                        } else {
                            info.req.user = decoded //[1]
                            cb(true)
                        }
                    })
        
                }
            }
        });

        app.use(express.json());
        app.use(express.urlencoded({ extended: true }));

        app.post('*', (req, res) => 
        {
            wss.clients.forEach(function each(client)
            {
                if (client !== wss && client.readyState === WebSocket.OPEN) 
                {
                  client.send(JSON.stringify({
                      type: 'on-webhook',
                      url: req.protocol + '://' + req.get('host') + req.originalUrl,
                      path: req.originalUrl,
                      body: req.body,
                      headers: req.headers
                  }));
                }
            });

            res.status(200)
            res.send("Ok")
        })

        app.get('*', (req, res) => { res.status(200).send({ status: 200, message: "Success", content: "Ok" })})

        wss.on('connection', function connection(ws) 
        {
            ws.on('message', function message(data) 
            {
                try
                {
                    console.log('received: %s', data);
                    let msg = JSON.parse(data)

                    if (msg.type == 'response')
                    {
                        msg.res(msg.status).send(msg.message)
                        return;
                    }

                    if (msg.type == 'keep-alive')
                    {
                        ws.send(JSON.stringify({ type: 'keep-alive' }));
                    }
                }
                catch(e)
                {
                    console.error(e)
                }
            });
          
            // ws.send('something');
        });

        
        const server = app.listen(port, () => { console.log(`Webhook Server Port: ${port}`) })
        server.on('upgrade', (request, socket, head) => {
            wss.handleUpgrade(request, socket, head, socket => {
                wss.emit('connection', socket, request);
            });
        });
    },



    client: async function(server, url, secret, base_url, omit_base_url)
    {
        if (!secret || !server || !url)
        {
            console.error("Incorrect Usage")
            return
        }
        
        if (secret === 'secret-key')
        {
            console.warn("!! Using default signing key, replace 'secret-key' with your own key")
            return
        }

        client_init(server, url, secret, base_url, omit_base_url)
    }
}

let last_keep_alive = true

function client_init(server, url, secret, base_url, omit_base_url)
{
    const token = jwt.sign({ name: 'auth' }, secret)
    const ws = new WebSocket('ws://' + url + '/ws', { perMessageDeflate: false, headers: { token: token } });
    console.log('(client) WebhookSimpleForwarder: Connecting to WebSocket server');

    ws.on('message', function (data) { client_handle_data(data, ws, server, base_url, omit_base_url) })


    ws.on('open', function() {
        console.log('(client) WebhookSimpleForwarder: Connected to WebSocket server');

        setInterval(() => {

            console.log(last_keep_alive)
            if (last_keep_alive == false)
            {
                console.warn("!! Weboscket disconnected because of no keep alive, Trying To Reconnect")
                setTimeout(() => client_init(server, url, secret, base_url, omit_base_url), 20000);
            }

            ws.send(JSON.stringify({
                type: 'keep-alive'
            }));

            last_keep_alive = false
        }, 30*1000);
    });
    ws.on('error', function() {
        console.warn('!! (client) WebhookSimpleForwarder: Socket Error');
    });
    ws.on('close', () => {
        console.log('!! (client) WebhookSimpleForwarder: Socket Closed, Reconnect');
        setTimeout(() => client_init(server, url, secret, base_url, omit_base_url), 20000);
    });
}


function client_handle_data(raw_msg, ws, server, base_url, omit_base_url)
{
    let parsed_msg = JSON.parse(raw_msg)

    switch (parsed_msg.type)
    {
        case 'keep-alive':
            last_keep_alive = true
            break;

        case 'on-webhook':
            console.log('webhook recieved from: parsed_msg')
            client_forward_webhook(server, parsed_msg, base_url, omit_base_url)
            break;

        default:
            console.warn('!! (client) WebhookSimpleForwarder: No packet type specified')
            break;
    }
}


async function client_forward_webhook(server, parsed_msg, base_url, omit_base_url)
{
    try
    { 
        if (!base_url || 
            parsed_msg.path.startsWith(base_url) || 
            parsed_msg.path.startsWith('/' + base_url))
        {
            if (omit_base_url)
                parsed_msg.path = parsed_msg.path.slice(base_url.length)

            let res = await axios.post('http://localhost:' + server.address().port + parsed_msg.path,
                { ...parsed_msg.body, _url: parsed_msg.url, _path: parsed_msg.path, _headers: parsed_msg.headers })
        }

        // console.log(res.status)
        // console.log(res.data)
    }
    catch(e)
    {
        console.error(e)
        // res.status(500).send({ status: 500, message: "Internal Server Error", content: e })
    }
}