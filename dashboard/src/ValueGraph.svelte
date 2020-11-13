<script>
  import { onMount } from 'svelte';
    
  export let data = [];
  export let width = 300;
  export let height = 50;

  let mountTime = Date.now();
  let animationDuration = 5;  // in seconds
  let animationPosition = 0;

  let minValue = Number.MAX_VALUE;
  let maxValue = -Number.MAX_VALUE;
  let alltimeMinValue = minValue;
  let alltimeMaxValue = maxValue;

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

  // update elements when data changes
  let elements = [];
  $: {
    let now = Date.now();
    elements = [];
    minValue = Number.MAX_VALUE;
    maxValue = -Number.MAX_VALUE;

    for (let i = 0; i < data.length - 1; i++) {
      
      let x1 = width - 2 + ((data[i].timestamp - mountTime) / (animationDuration * 1000) % 1) * width;
      // let x2 = width - 2 + ((data[i+1].timestamp - mountTime) / (animationDuration * 1000) % 1) * width;
      // let y2 = height - data[i+1].value;    

      minValue = Math.min(data[i].value - 0.1, minValue);
      maxValue = Math.max(data[i].value*1 + 0.1, maxValue);

      let y1 = height - 2 - (data[i].value - alltimeMinValue) / (alltimeMaxValue - alltimeMinValue) * (height - 4);    

      let element = {
        uid: data[i].uid,
        timestamp: data[i].timestamp,
        x: x1,
        y: y1,
        color: data[i].color,
        visibility: ((now - data[i].timestamp) > animationDuration * 1000 - 100 ? 'hidden' : 'visible'),
      }
      elements.push(element);
    }

    alltimeMinValue = Math.min(alltimeMinValue, minValue);
    alltimeMaxValue = Math.max(alltimeMaxValue, maxValue);

    // console.log(minValue, maxValue);
  }

</script>


<!-- ------------------------------------------------------------ -->

<svg {width} {height}>
  <g id='mover' transform='translate({animationPosition} 0)'>
    {#each elements as element}
      <circle cx={element.x} cy={element.y} r='2' visibility={element.visibility} fill={element.color}/> 
      <circle cx={element.x-width} cy={element.y} r='2' visibility={element.visibility} fill={element.color}/> 
    {/each}
    <!-- <line x1={0} y1={2} x2={width} y2={height-2} stroke='black' opacity='0.3'/>
    <line x1={width} y1={2} x2={2*width} y2={height-2} stroke='black' opacity='0.3'/> -->
  </g>
</svg>

<!-- ------------------------------------------------------------ -->


<style>
</style>






