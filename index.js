const express   = require('express')
const WebSocket = require('ws');
const axios     = require('axios');

module.exports =
{
    server: function(port = 3000)
    {
        const app = express()
        const wss = new WebSocket.WebSocketServer({ noServer: true });

        app.get('*', (req, res) => 
        {
            wss.clients.forEach(function each(client)
            {
                if (client !== wss && client.readyState === WebSocket.OPEN) 
                {
                  client.send(JSON.stringify({
                      url: req.protocol + '://' + req.get('host') + req.originalUrl,
                      path: req.originalUrl,
                      body: req.body,
                  }));
                }
            });

            res.status(200)
            res.send("Ok")
        })

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



    client: async function(server)
    {
        const app = express()
        const ws = new WebSocket('ws://localhost:3000/ws', { perMessageDeflate: false });
        
        ws.on('message', async function message(data) {
            console.log('client received: %s', data);
            let msg = JSON.parse(data)

            try
            {
                let res = await axios.post('http://localhost:' + server.address().port + msg.path, msg.body)
                console.log(res.status)
                console.log(res.data)
            }
            catch(e)
            {
                console.error(e)
                res.status(500).send({ status: 500, message: "Internal Server Error", content: e })
            }

        });
    }
}