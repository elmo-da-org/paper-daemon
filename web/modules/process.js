async function getData(next) {
    const os = require('os');
    const si = require('systeminformation');

    //Const -hopefully
    const giga = 1024 * 1024 * 1024;
    const cpus = os.cpus();

    const out = {
        memory: {usage: 0, used: 0, total: 0},
        cpu: {
            count: cpus.length,
            speed: cpus[0].speed,
            usage: 0,
            text: cpus[0].model
        },
    };

    //Getting memory usage
    try {
        let free, total, used;

        free = os.freemem() / giga;
        total = os.totalmem() / giga;
        used = total - free;

        out.memory = {
            used,
            total,
            usage: Math.round((used / total) * 100),
        };
    } catch (error) {

    }

    //Getting CPU usage
    try {
        const loads = await si.currentLoad();
        out.cpu.usage = Math.round(loads.currentLoad);
    } catch (error) {
        console.log(error)
    }

    next(out);
}

module.exports.getData = getData;