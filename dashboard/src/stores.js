import { readable, writable, derived } from 'svelte/store';

export const appActive = writable(true);

export const time = readable(new Date(), function start(set) {
	const interval = setInterval(() => {
		set(new Date());
	}, 1000);

	return function stop() {
		clearInterval(interval);
	};
});

let uid = 0;
export const dataLatest = writable({}, function start(set) {
	let ws = new WebSocket("ws://localhost:1880/ws/receive");
	
	ws.onopen = function(e) {
		console.log("Opened websocket connection");
		// console.log(e);
	}

	ws.onmessage = function(e) {
		let obj = JSON.parse(e.data);
		obj.timestamp = Date.now();
		obj.uid = uid++;
		set(obj);
	}
});



let dataByTimeMaxCount = 10;
let dataByTimeArray = [];
export const dataByTime = derived(
	dataLatest,
	$dataLatest => {
		if (Object.keys($dataLatest).length > 0) dataByTimeArray.push($dataLatest);
		if (dataByTimeArray.length > dataByTimeMaxCount) dataByTimeArray.shift();
		return dataByTimeArray;
	}
);


// let dataByUserMaxTime = 5000;   // in milliseconds
let dataByUserMaxCount = 100;
let dataByUserObject = {};
export const dataByUser = derived(
	dataLatest,
	$dataLatest => {
		if (Object.keys($dataLatest).length > 0) {
			if (!dataByUserObject[$dataLatest.user]) dataByUserObject[$dataLatest.user] = []; 
			dataByUserObject[$dataLatest.user].push($dataLatest);

			// dataByUserObject[$dataLatest.user]
			// let now = Date.now();
			// while (dataByUserObject[$dataLatest.user][0].timestamp < now - dataByUserObject) &&  {
			// 	dataByUserObject[$dataLatest.user].shift();
			// }
			if (dataByUserObject[$dataLatest.user].length > dataByUserMaxCount) dataByUserObject[$dataLatest.user].shift();
		}
		return dataByUserObject;
	}
);



// export const data = writable([], function start(set) {
// 	let ws = new WebSocket("ws://localhost:1880/ws/receive");

// 	ws.onopen = function(e) {
// 		console.log(e);
// 	}

// 	ws.onmessage = function(e) {
// 		data.update(d => {
// 			let dat = JSON.parse(e.data);
// 			d = d.concat(dat);
// 			if (d.length > 10) d.shift();
// 			return d;
// 		});
// 	}
  
// });