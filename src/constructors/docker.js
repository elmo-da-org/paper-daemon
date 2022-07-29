const DockerPackage = require('dockerode');
const _ = require('lodash');
const Moment = require('moment');
const DockerController = new DockerPackage({

});
const ab2str = require('arraybuffer-to-string')
const Util = require('util');
const Carrier = require('carrier');
const Async = require('async');
const fs_ = require('fs');
const fs = require('fs-extra');
const extendify = require('extendify');
const Log = require('../helpers/logger').Log

// Variables

const CONST_LOWMEM_PCT = 0.096;
const CONST_STDMEM_PCT = 0.054;
const CONST_HIGHMEM_PCT = 0.021;

const CONST_LOWMEM = 1024;
const CONST_STDMEM = 10240;

class Docker {
    constructor(server, next) {
        this.server = server;
        this.containerID = _.get(this.server.json, 'uuid', null);
        this.container = DockerController.getContainer(this.containerID)

        this.stream = undefined;
        this.procData = undefined;
        this.logStream = null;

        this.isStopping = false;
    }

    hardlimit(memory) {
        if (memory < CONST_LOWMEM) {
            return memory + (memory * CONST_LOWMEM_PCT);
        } else if (memory >= CONST_LOWMEM && memory < CONST_STDMEM) {
            return memory + (memory * CONST_STDMEM_PCT);
        } else if (memory >= CONST_STDMEM) {
            return memory + (memory * CONST_HIGHMEM_PCT);
        }
        return memory;
    }

    build(next) {
        const config = this.server.json.build;
        const bindings = {};
        const exposed = {};

        fs.mkdirSync(this.server.path(), { recursive: true });

        Async.each(config.ports, (port) => {
            if (/^\d{1,6}$/.test(port) !== true) return;
            bindings[Util.format('%s/tcp', port)] = [{
                'HostIp': '127.0.0.1',
                'HostPort': port.toString(),
            }];
            bindings[Util.format('%s/udp', port)] = [{
                'HostIp': '127.0.0.1',
                'HostPort': port.toString(),
            }];
            exposed[Util.format('%s/tcp', port)] = {};
            exposed[Util.format('%s/udp', port)] = {};

            
            Log('warn', `Exposed ports: ${exposed}`)
        });

        Log('info', 'Creating new container...')

        if (_.get(config, 'image').length < 1) {
            return callback(new Error('No docker image was passed to script. Unable to create container with null container.'));
        }

        // Create the container
        const Container = {
            Image: _.trimStart(config.image, '~'),
            name: this.server.json.uuid,
            Hostname: (this.server.json.uuid).toString(),
            User: (1000).toString(),
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            OpenStdin: true,
            Tty: true,
            ExposedPorts: exposed,
            HostConfig: {
                Mounts: [
                    {
                        Target: '/home/container',
                        Source: this.server.path(),
                        Type: 'bind',
                        ReadOnly: false,
                    },
                ],
                
                PortBindings: bindings,
                NetworkMode: 'lightning_net',
                
                Memory: Math.round(this.hardlimit(this.server.json.Memory) * 1000000),
                MemoryReservation: Math.round(this.server.json.Memory * 1000000),
                MemorySwap: -1,
                CpuQuota: 25000,
                CpuPeriod: 50000,
                CpuShares: 1024,
            }
        };

        if (config.swap >= 0) {
            Container.HostConfig.MemorySwap = Math.round((this.hardlimit(config.memory) + config.swap) * 1000000);
        }

        DockerController.createContainer(Container, (err, container) => {
            fs_.readFile(`./config/servers/${this.server.json.uuid}.json`, function(err, data) {
                if (err) throw err;
               
                let modified = {
                    enviroment: {
                        RUST_SERVER_IDENTITY: "docker",
                        RUST_SERVER_PORT: "28015",
                        RUST_SERVER_SEED: "12345",
                        RUST_SERVER_NAME: "Rust Server [DOCKER]",
                        RUST_SERVER_BANNER_URL: "",
                        RUST_RCON_WEB: "1",
                        RUST_RCON_PORT: "28016",
                        RUST_RCON_PASSWORD: "docker",
                        RUST_SERVER_WORLDSIZE: "3500",
                        RUST_SERVER_MAXPLAYERS: "500",
                        RUST_SERVER_SAVE_INTERVAL: "600",
                    }
                }

                const json_read = JSON.parse(data);
                const deepExtend = extendify({
                    inPlace: false,
                    arrays: 'replace',
                });

                const modifiedJson = deepExtend(json_read, modified);
                
                
                fs.writeJson(`./config/servers/example.json`, modifiedJson, { spaces: 2 }, err => {

                });
            });
        });
    }

    start(callback) {
        let cont = this.container
        let attach = this.attach
        let update = this.update

        containerHandler()
        let rawdata = fs_.readFileSync(`config/servers/${this.containerID}.json`);
        let json = JSON.parse(rawdata);

        let environment = _.reduce(_.split('enviroment', '.'), (o, i) => o[i], json);

        function containerHandler() {
            cont.start(function (err) {
                command(`/entrypoint.sh +server.identity ${environment["RUST_SERVER_IDENTITY"]} +server.port ${environment["RUST_SERVER_PORT"]} +server.seed ${environment["RUST_SERVER_SEED"]} +server.hostname ${environment["RUST_SERVER_NAME"]} +rcon.web ${environment["RUST_RCON_WEB"]} +rcon.port ${environment["RUST_RCON_PORT"]} +rcon.password ${environment["RUST_RCON_PASSWORD"]} +server.worldsize ${environment["RUST_SERVER_WORLDSIZE"]} +server.maxplayers ${environment["RUST_SERVER_MAXPLAYERS"]} +server.saveinterval ${environment["RUST_SERVER_SAVE_INTERVAL"]} +query_port 28016`);
            });
        }

        function remove_non_ascii(str) {
            if ((str===null) || (str===''))
                return false;
            else
                str = str.toString();
                
            return str.replace(/[^\x20-\x7E]/g, '');
        }
          
        
        function command(cmd) {
            var options = {
                'AttachStdout': true,
                'AttachStderr': true,
                'Tty': false,
                Cmd: ["bash", "-c", cmd]
            };
            cont.exec(options, function (err, exec) {
                if (err) return console.log(err);
        
                Promise.all([
                    attach()
                ])

                var attach_opts = {'Detach': false, 'Tty': false, stream: true, stdin: true, stdout: true, stderr: true};
                exec.start(attach_opts, function (err, stream) {
                    if (err) return console.log(err);
                    
                    stream.on('data', function(data) {
                        if (_.replace(data, /\s+/g, '').length > 1) {
                            console.log(Buffer.from(data))
                            global.io.emit('console', 'global', data.toString());
                        }
                    });
                });
            });
        }
    }

    stop(callback) {
        if (this.isStopping == false) {
            this.isStopping = true
            this.container.stop(callback); 
        }
    }

    kill(callback) {
        this.container.kill(callback);
    }

    stats() {
        return this.container.stats({ stream: true }).then(stream => {
            stream.setEncoding('utf8');

            Carrier.carry(stream, data => {
                this.procData = (_.isObject(data)) ? data : JSON.parse(data);
            });

            stream.on('end', () => {
                this.procData = undefined;
            });
        });
    }

    update(next) {
        const config = this.server.json.build;

        const ContainerConfiguration = {
            Memory: Math.round(this.hardlimit(config.Memory) * 1000000),
            MemoryReservation: Math.round(config.Memory * 1000000),
            MemorySwap: -1,
            CpuQuota: 50000,
            CpuPeriod: 50000,
            CpuShares: 2048,
        };

        Log('success', 'Successfully updating containers configuration.')

        this.container.update(ContainerConfiguration, next);
    }

    attach() {
        
    }

    destroy(container, next) {
        const FindContainer = DockerController.getContainer(container);
        FindContainer.inspect(err => {
            if (!_.isNull(this.logStream)) {
                this.logStream.unwatch();
                this.logStream = null;
            }

            if (!err) {
                this.container.remove(next);
            } else if (err && _.startsWith(err.reason, 'no such container')) { // no such container
                this.server.log.debug({ container_id: container }, 'Attempting to remove a container that does not exist, continuing without error.');
                return next();
            } else {
                return next(err);
            }
        });
    }
}

module.exports = Docker;