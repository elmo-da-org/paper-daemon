const Async = require('async');
const Package = require('../package.json')
const Initializer = require('./constructors/initializer').Initialize;
const BuilderController = require('./constructors/builder');
const SocketController = require('./routes/socket');
const NetworkController = require('./constructors/network');
const Log = require('./helpers/logger').Log;

Log('info', 'Modules loaded, starting the daemon ⚡')

if (Package.version === '0.0.0-canary') {
    Log('warn', 'Lightning is running nightly build. Everything is up to date!')
} else {
    Log('warn', 'Lightning is running production build. Everything is up to date!')
}

//var json = {
//    "uuid": "example",
//    "build": {
//        "image": "rust-game",
//        "ports": [28015, 28016, 8080],
//        "memory": 2048,
//        "cpu": 200,
//        "uuid": "example"
//    },
//    "enviroment": {
//        
//    }
//}
//
//const Builder = new BuilderController(json);
//Builder.init();

const Initialize = new Initializer;
const Network = new NetworkController;
const Socket = new SocketController;

Initialize.createConfigFolders();
Network.initialize(function(err) {

});

Socket.initialize(function(err) {

})

Log('success', 'Beginning server initialization process.');

Initialize.init();