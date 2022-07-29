import { PaperAPI } from './paper_api.js';

function requestServers() {
    PaperAPI('request/servers', function(data) {
        if (data) {
            for (let i = 0; i < data.length; i++) {
                $('#serverList').append(`
                    <tr id="${data[i].uuid}">
                        <td>
                           <strong style="word-wrap: break-word;">${data[i].uuid}</strong>
                           <em>(${data[i].build.image})</em>
                           <br>
                           TODO: Description
                        </td>
                        <td class="tableActions">
                            <a class="btn btn-sm btn-outline-success d-block d-md-inline-block mr-md-1 mb-1 mb-md-0 " href="#" onclick="myFunction('${data[i].build.uuid}', 'on'); event.preventDefault();">
                                Start
                            </a>
                            <a class="btn btn-sm btn-outline-danger d-block d-md-inline-block mr-md-1 mb-1 mb-md-0 " href="#" onclick="myFunction('${data[i].build.uuid}', 'off'); event.preventDefault();">
                                Stop
                            </a>
                            <a class="btn btn-sm btn-outline-info d-block d-md-inline-block m-0 " href="/server/${data[i].build.uuid}">
                                View
                            </a>
                        </td>
                    </tr>   
                `);
            }
        }
    })
}



//==================================================================
//                          On Page Loaded
//==================================================================
document.addEventListener('DOMContentLoaded', function(event) {
    //Setting up status refresh
    requestServers();
});