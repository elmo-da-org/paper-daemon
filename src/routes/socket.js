let io = undefined;
const Log = require('../helpers/logger').Log;
const socket = require('socket.io');
const express = require('express');
const Initializer = require('../constructors/initializer')
const Ansi = require('ansi-escape-sequences');

class SocketHandler {
    constructor() {

    }

    initialize(callback) {
        var app     = express();
        var server  = require('http').createServer(app);
        io          = socket(server, {
            cors: {
              origin: "*",
              methods: ["GET", "POST"]
            }
        });
        global.io = io
        const port = 5250;

        io.on('connection', function(client) {
            console.log('Client connected...');

            global.io.emit('console', 'global', `${Ansi.style.green}[Paper Daemon] Connected to Socket.IO server`);

            client.on('powerAction', (uuid, type) => {
                if (type == 'on') {
                    Initializer.Servers[uuid].docker.update(function( ) {
                        Initializer.Servers[uuid].docker.start()
                    })
                } else if (type == 'off') {
                    Initializer.Servers[uuid].docker.stop()
                }
            });
        });


        // at the bottom of app.js
        server.listen(port, () => {
          console.log(`Server listening on Port ${port}`);
        })
    }
}

module.exports = SocketHandler
module.exports.Socket = io
