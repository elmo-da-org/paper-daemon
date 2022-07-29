import { PaperAPI } from './paper_api.js';

const REQ_LOOP_INTERVAL = 1000;

function requestData() {
    PaperAPI('request/processdata', function(data) {
        if (data) {
            $('#hostusage-cpu-bar').attr('aria-valuenow', data.cpu.usage).css('width', data.cpu.usage + '%');
            $('#hostusage-cpu-text').html(data.cpu.usage + '% of ' + data.cpu.count + 'x ' + data.cpu.speed + ' MHz');
            $('#hostusage-memory-bar').attr('aria-valuenow', data.memory.usage).css('width', data.memory.usage + '%');
            $('#hostusage-memory-text').html(data.memory.usage + '% (' + (Math.round(data.memory.used * 100) / 100).toFixed(2) + '/' + (Math.round(data.memory.total * 100) / 100).toFixed(2) + ' GB)');
        }
    });
}

document.addEventListener('DOMContentLoaded', function(event) {
    //Setting up status refresh
    requestData();

    setInterval(requestData, REQ_LOOP_INTERVAL);
});