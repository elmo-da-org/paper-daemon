const fs = require('fs');
const fs_extra = require('fs-extra');
const _ = require('lodash');
const Klaw = require('klaw');
const Async = require('async');
const Util = require('util');
const Path = require('path');
const Log = require('../helpers/logger').Log

const Server = require('../constructors/server');
const Servers = {}

class Initialize {
    init(next) {
        this.folders = [];
        Klaw('./config/servers/').on('data', data => {
            this.folders.push(data.path)
        }).on('end', () => {
            Async.each(this.folders, (file, callback) => {
                if (Path.extname(file) !== '.json') {
                    return callback();
                }

                fs_extra.readJson(file).then(json => {
                    if (_.isUndefined(json.uuid)) {
                        Log('error', Util.format('Detected valid JSON, but server was missing a UUID in %s, skipping...', file));
                        
                        return callback();
                    }

                    this.setup(json, callback);
                })
            })
        })
    }

    setup(json, next) {
        Async.series([
            callback => {
                if (!_.isUndefined(Servers[json.uuid])) {
                    delete Servers[json.uuid];
                }

                Servers[json.uuid] = new Server(json, callback);
                Servers[json.uuid].initContainer()
            },
            callback => {
                this.initContainer(err => {
                    if (err && err.code === 'PTDL_IMAGE_MISSING') {
                        Log('error', 'Unable to initalize the server container due to a missing docker image.');
                    } else if (err) {
                        return callback(err);
                    }

                    return callback();
                });
            }
        ], err => {
            if (err) return next(err);

            return next(null, Servers[json.uuid]);
        });
    }

    setupByUuid(uuid, next) {
        Fs.readJson(Util.format('./config/servers/%s/server.json', uuid), (err, object) => {
            if (err) return next(err);
            this.setup(object, next);
        });
    }

    createConfigFolders() {
        if (!fs.existsSync('./config/servers')){
            fs.mkdirSync('./config/servers', { recursive: true });
        }

        if (!fs.existsSync('./config/global')){
            fs.mkdirSync('./config/global', { recursive: true });
        }
    }
}

exports.Initialize = Initialize;
exports.Servers = Servers;