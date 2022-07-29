const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const Path = require('path')
const Fs = require('fs-extra');
const Docker = require('./docker');
const Log = require('../helpers/logger').Log;
const Querystring = require('querystring')

class Server extends EventEmitter {
    constructor(json, callback) {
        super();

        this.status = 0
        this.json = json;
        this.uuid = this.json.uuid;
        this.processData = {
            query: {},
            process: {},
        }

        this.intervals = {
            process: null,
            query: null,
        }

        this.shouldRestart = false;
        this.knownWrite = false;
        this.buildInProgress = false;
        this.configDataLocation = Path.join(__dirname, './config/servers/', this.uuid)
        this.configLocation = Path.join(this.configDataLocation, 'server.json')
        this.cotnainerInitialized = false;

        this.blockBooting = false;
        this.currentDiskUsed = 0;
        this.lastCrash = undefined;

    }


    path(location) {
        const dataPath = Path.join('/srv/daemon-data', this.json.uuid);

        if (_.isUndefined(location) || _.replace(location, /\s+/g, '').length < 1) {
            return dataPath;
        }

        // Dangerous path, do not rely on this as the final output location until running it through
        // the fs.realpath function.
        let returnPath = null;
        let nonExistentPathRoot = null;
        const resolvedPath = Path.join(dataPath, Path.normalize(Querystring.unescape(location)));

        try {
            returnPath = Fs.realpathSync(resolvedPath);
        } catch (err) {
            // Errors that aren't ENOENT should generally just be reported to the daemon output, I'm not
            // really sure what they could possibly be, but we should log it anyways and then
            // just return the default data path for the server. When this happens, pray that the
            // calling function is smart enough to do a stat and determine if the operation
            // is happening aganist a directory, otherwise say hello to an ESDIR error code.
            if (err.code !== 'ENOENT') {
                this.log.error(err);
                return dataPath;
            }

            const minLength = _.split(dataPath, '/').length;
            const pathParts = _.split(Path.dirname(resolvedPath), '/');

            // Prevent malicious users from trying to slow things down with wild paths.
            if (pathParts.length > 50) {
                Log('error', 'Attempting to determine path resolution on a directory nested more than 50 levels deep.')

                return dataPath;
            }

            // Okay, so the path being requested initially doesn't seem to exist on the system. Now
            // we will loop over the path starting at the end until we reach a directory that does exist
            // and check the final path resoltuion for that directory. If there is an unexpected error or
            // we get to a point where the path is now shorter than the data path we will exit and return
            // the base data path.
            _.some(pathParts, () => {
                if (pathParts.length < minLength) {
                    return true;
                }

                try {
                    nonExistentPathRoot = Fs.realpathSync(pathParts.join('/'));
                    return true;
                } catch (loopError) {
                    if (loopError.code !== 'ENOENT') {
                        Log('critical', loopError)
                        return true;
                    }

                    // Pop the last item off the checked path so we can check one level up on
                    // the next loop iteration.
                    pathParts.pop();
                }

                return false;
            });
        }

        // If we had to traverse the filesystem to resolve a path root we should check if the final
        // resolution is within the server data directory. If so, return at this point, otherwise continue
        // on and check aganist the normal return path.
        if (!_.isNull(nonExistentPathRoot)) {
            if (_.startsWith(nonExistentPathRoot, dataPath)) {
                return resolvedPath;
            }
        }

        if (_.startsWith(returnPath, dataPath)) {
            return returnPath;
        }

        // If we manage to get to this point something has gone seriously wrong and the user
        // is likely attempting to escape the system. Just throw a fatal error and pray that
        // the rest of the daemon is able to handle this.
        const e = new Error(`could not resolve a valid server data path for location ["${Querystring.unescape(location)}"]`);
        e.code = 'P_SYMLINK_RESOLUTION';

        throw e;
    }

    initContainer(next) {
        this.docker = new Docker(this, (err, status) => {
            
        });
    }
}

module.exports = Server