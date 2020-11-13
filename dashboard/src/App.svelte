<script>
  import { appActive, dataLatest, dataByTime, dataByUser } from './stores.js';
  import WidgetUser from './WidgetUser.svelte';

  // $: console.log($dataLatest);
  // $: console.log($dataByTime);
  // $: console.log($dataByUser);

  let showGraphs = true;

  $: userdataArray = Object.entries($dataByUser);

	function toggleShowGraphs() {
    showGraphs = !showGraphs;
  }

</script>


<!-- ------------------------------------------------------------ -->


<div id='head'>

  <div style='flex-grow: 1'>
    <h2>Laborwoche Dashboard</h2>
  </div>

  <!-- <div>
    <button on:click={toggleShowGraphs}>
      {#if showGraphs}
        Hide Graphs
      {:else}
        Show Graphs
      {/if}
    </button>
  </div> -->

</div>

<div id='user-widgets'>
  <!-- {#if userdataArray[0]} 
    <WidgetUser data={userdataArray[0]} {showGraphs}/> 
  {/if} -->
  {#each userdataArray as userdata (userdata[0])}
	  <WidgetUser data={userdata} {showGraphs}/>
  {/each}
</div>


<!-- ------------------------------------------------------------ -->


<style>
  #head {
    margin: 10px;
    display: flex;
    align-items: center;
  }
</style>