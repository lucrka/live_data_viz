<script>
  import { onMount } from 'svelte';
  import { appActive } from './stores.js';
  
  // get data of that user in form [{user:'...', origPayload:'...', timestamp:'...'}, ...]
  export let data = [];
  export let width = 300;
  export let height = 50;

  let mountTime = Date.now();
  let animationDuration = 5;  // in seconds
  let animationPosition = 0;

  // implement a loop when component is mounted
	onMount(() => {
		let frame;
    mountTime = Date.now();

		function loop() {
			frame = requestAnimationFrame(loop);
      let now = Date.now();
      animationPosition = -((now - mountTime) / (animationDuration * 1000) % 1) * width;
		}
		loop();

		return () => cancelAnimationFrame(frame);
	});

  // update rects when data changes
  let rects = [];
  $: {
    let now = Date.now();
    rects = [];
    for (let i = 0; i < data.length; i++) {
      let rect = {
        uid: data[i].uid,
        timestamp: data[i].timestamp,
        x: width - 2 + ((data[i].timestamp - mountTime) / (animationDuration * 1000) % 1) * width,
        opacity: i / data.length,
        visibility: ((now - data[i].timestamp) > animationDuration * 1000 - 200 ? 'hidden' : 'visible'),
      }
      rects.push(rect);
    }
  }


</script>


<!-- ------------------------------------------------------------ -->

<svg {width} {height}>
  <g id='mover' transform='translate({animationPosition} 0)'>
    {#each rects as rect (rect.uid)}
      <rect x={rect.x} y={0} width={2} height={height} visibility={rect.visibility}/> 
      <rect x={rect.x - width} y={0} width={2} height={height} visibility={rect.visibility}/> 
    {/each}
  </g>
</svg>

<!-- ------------------------------------------------------------ -->


<style>
</style>






