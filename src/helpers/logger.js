const chalk = require('chalk')

function Log(type, message) {
    let color = chalk.gray
    let pref = "N/A"

    if (type == "info") {
        color = chalk.blue
        pref = "INFO-DAEMON"
    } else if (type == "warn") {
        color = chalk.hex('#FFA500')
        pref = "WARN-DAEMON"
    } else if (type == "error") {
        color = chalk.red
        pref = "ERROR-DAEMON"
    } else if (type == "success") {
        color = chalk.green
        pref = "SUCCESS-DAEMON"
    } else if (type == "critical") {
        color = chalk.bold.red
        pref = "CRITICAL-DAEMON"
    }

    console.log(color('[' + pref + '] ') + color.reset(message))
}

module.exports = {
    Log
}