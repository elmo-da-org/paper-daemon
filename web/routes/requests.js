const axios = require('axios');

const process_module = require('../modules/process');
const servers_module = require('../modules/servers');

function createRoutes(app) {
    app.get('/request/processdata', async (req, res) => {
        process_module.getData(function(out) {
            res.send(out);
        });
    })

    app.get('/request/servers', async (req, res) => {
       servers_module.getData(function(servers) {
            res.send(servers)
       });
    })


    app.post('/request/serverPowerAction', async (req, res) => {
        console.log(req.body)

        axios.post('http://localhost:5211/reciever/postPowerAction', {
            uuid: req.body.uuid,
            power_action: req.body.type
        })
        .then(function(response) {
          res.send(response)
        })
        .catch(function(error) {
          res.send(error)
        });
    })

    app.post('/auth/password', function(req, res, next) {
    	let username = req.body.username;
    	let password = req.body.password;
    
        if (username == "poo" && password == "poo") {
    		req.session.loggedin = true;
    		req.session.username = 'poo';

    		res.redirect('/servers');
        } else {
            req.session.loggedin = false;

            res.send('Failed to authenticate')
            res.end()
        }
    })
}

module.exports.createRoutes = createRoutes;