// const { app } = require('electron');
// app.on('window-all-closed', () => {
//   app.quit()
// })

const fs = require('fs');

// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
//const source = '/dev/cu.wchusbserial1410';
const source = '/dev/tty.MotionTrackerThingA-DevB';
// const source = '/dev/tty.MotionTrackerThing3-DevB';

//const baud = 9600; // 100ms, ? spikes due to noise
//const baud = 38400; // 27ms, < 1 second spikes
//const baud = 74880; // 15ms, no spikes
const baud = 115200; // 15ms, no spikes
//const baud = 250000; // 15ms, no spikes

const file = './data_' + new Date().getTime() + '.txt';

let update = 1;
let maxPoints = 240;
let height = 50;

let node = {
  ypr: {y: 0, p: 0, r: 0},
  acceleration: {x:0, y:0, z: 0}
};
let nodeDelta = {
  ypr: {y: 0, p: 0, r: 0},
  acceleration: {x:0, y:0, z: 0}
};

console.log('renderer.js using source:', source);
console.log('exporting data to ', file);

// ypr graphs
var yprGraph = new Rickshaw.Graph( {
  element: document.getElementById("ypr"),
  width: 720,
  height: height,
  min: 'auto',
  renderer: 'line',
  series: new Rickshaw.Series.FixedDuration([{ name: 'y' }], undefined, {
		timeInterval: update,
		maxDataPoints: maxPoints,
		timeBase: new Date().getTime() / 1000
	})
});
yprGraph.render();
var yprDeltaGraph = new Rickshaw.Graph( {
  element: document.getElementById("yprDelta"),
  width: 720,
  height: height,
  min: 'auto',
  renderer: 'line',
  series: new Rickshaw.Series.FixedDuration([{ name: 'y' }], undefined, {
		timeInterval: update,
		maxDataPoints: maxPoints,
		timeBase: new Date().getTime() / 1000
	})
});
yprDeltaGraph.render();

// acceleration graphs
var accelerationGraph = new Rickshaw.Graph( {
  element: document.getElementById("acceleration"),
  width: 720,
  height: height,
  min: 'auto',
  renderer: 'line',
  series: new Rickshaw.Series.FixedDuration([{ name: 'y' }], undefined, {
		timeInterval: update,
		maxDataPoints: maxPoints,
		timeBase: new Date().getTime() / 1000
	})
});
accelerationGraph.render();

var accelerationDeltaGraph = new Rickshaw.Graph( {
  element: document.getElementById("accelerationDelta"),
  width: 720,
  height: height,
  min: 'auto',
  renderer: 'line',
  series: new Rickshaw.Series.FixedDuration([{ name: 'y' }], undefined, {
		timeInterval: update,
		maxDataPoints: maxPoints,
		timeBase: new Date().getTime() / 1000
	})
});
accelerationDeltaGraph.render();

// timeDelta graph
var timeDeltaGraph = new Rickshaw.Graph( {
  element: document.getElementById("time"),
  width: 720,
  height: height,
  min: 'auto',
  renderer: 'line',
  series: new Rickshaw.Series.FixedDuration([{ name: 'time' }], undefined, {
		timeInterval: update,
		maxDataPoints: maxPoints,
		timeBase: new Date().getTime() / 1000
	})
});
timeDeltaGraph.render();

// Update
var iv = setInterval(function() {
  yprGraph.series.addData(node.ypr);
  yprGraph.render();

  yprDeltaGraph.series.addData(nodeDelta.ypr)
  yprDeltaGraph.render();

  accelerationGraph.series.addData(node.acceleration);
  accelerationGraph.render();

  accelerationDeltaGraph.series.addData(nodeDelta.acceleration);
  accelerationDeltaGraph.render();

  timeDeltaGraph.series.addData({time: nodeDelta.time});
  timeDeltaGraph.render();
}, update);


console.log('charts setup');

const SerialPort = require('serialport');
var device = new SerialPort(source, { parser: SerialPort.parsers.readline('\n'), baud: baud});
device.on('open', () => {
  console.log('Connection opened\nWaiting for data...')
  device.write("Send", console.log);
});
device.on('data', (data) => {
  //console.log('Raw Data:', data);
  if (data.substring(0, 4) == '0.2:') {
    let lastNode = node;
    try {
      node = JSON.parse(data.substring(4));

      node.timeStamp = new Date().getTime();

      nodeDelta = {time: node.time - lastNode.time,
        ypr: {
          x: lastNode.ypr.y - node.ypr.y,
          y: lastNode.ypr.p - node.ypr.p,
          z: lastNode.ypr.r - node.ypr.r
        },
        acceleration: {
          x: lastNode.acceleration.x - node.acceleration.x,
          y: lastNode.acceleration.y - node.acceleration.y,
          z: lastNode.acceleration.z - node.acceleration.z
        }
      };

      document.getElementById('data1').innerHTML = 'Node<pre>' + JSON.stringify(node, null, 2) + '</pre>';
      document.getElementById('data2').innerHTML = 'nodeDelta<pre>' + JSON.stringify(nodeDelta, null, 2) + '</pre>';

      fs.appendFileSync(file, JSON.stringify(node) + "\n");
    } catch(e) {
      console.log("ERROR", e);
    }
  } else {
    console.log('other data:', data);
  }
});
