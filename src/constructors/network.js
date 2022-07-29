const Dockerode = require("dockerode");
const _ = require('lodash');
const Log = require('../helpers/logger').Log;

class Network {
    constructor() {
        this.dockerController = new Dockerode({})

        this.network_name = 'lightning_net'
    }

    initialize(callback) {
        this.dockerController.listNetworks((err, networks) => {
            if (err) return callback(err);
            const foundNetwork = _.find(networks, values => {
                if (values.Name === this.network_name) return values.Name;
            });

            if (!_.isUndefined(foundNetwork)) {
                
                Log('success', `Found network interface for daemon: ${this.network_name}`);

                return callback();
            }
            this.buildNetwork(next);
        });
    }

    // Builds an isolated network for all containers to run on
    buildNetwork(callback) {
        Log('warn', 'No insolated network interface for lightning containers was detected, Attempting to create one now')

        this.dockerController.createNetwork({
            Name: this.network_name,
            Driver: 'bridge',
            EnableIPv6: true,
            Internal: false,
            IPAM: {
                Config: [
                    {
                        Subnet: '172.18.0.0/16',
                        Gateway: '172.18.0.1',
                    },
                    {
                        Subnet: 'fdba:17c8:6c94::/64',
                        Gateway: 'fdba:17c8:6c94::1011',
                    },
                ],
            },
            Options: {
                'encryption': 'false',
                'com.docker.network.bridge.default_bridge': 'false',
                'com.docker.network.bridge.enable_icc': 'true',
                'com.docker.network.bridge.enable_ip_masquerade': 'true',
                'com.docker.network.bridge.host_binding_ipv4': '0.0.0.0',
                'com.docker.network.bridge.name': 'avalanche0',
                'com.docker.network.driver.mtu': '1500',
            },
        }, err => {
            if (err) return callback(err);
            console.log(`Successfully created new network (${this.network_name}) on ${this.network_name + '0'} for isolated lightning containers.`)

            return callback();
        })
    }
}

module.exports = Network;