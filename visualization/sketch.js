const dataSize = 120
let dataArray =[{
    mag: {
        x: 34,
        y: 2,
        z: -85,
    },
    temp: 25,
    rel_hum: 41}, 
    {
    mag: {
        x: 34,
        y: 2,
        z: -85,
    },
    temp: 25,
    rel_hum: 41}, 
    {
    mag: {
        x: 34,
        y: 2,
        z: -85,
        },
    temp: 25,
    rel_hum: 41}];



let ws = new WebSocket("ws://localhost:1880/ws/receive")


function setup(){
    createCanvas(1200, 900);
    background(0);
    dataArray = [];
}

function draw(){
    background(0);
    dataArray.forEach((pkg, index) => {
        push();
        fill(200, 255, 100);
        rect(index*10, 900-pkg.rel_hum*2, 10, pkg.rel_hum*3);
        pop();
    });
}

ws.onopen = function (event) {
    console.log("connected");
};

ws.onmessage = function (event) {
    dataArray.push(JSON.parse(event.data));
    // console.log(data);
    if(dataArray.length > dataSize){
        dataArray.shift();
    }

    // if(dataArray.length == 300){
    //     downloadObjectAsJson(dataArray, "saved_data")
    // }
}

function downloadObjectAsJson(exportObj, exportName){
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
    var downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", exportName + ".json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }