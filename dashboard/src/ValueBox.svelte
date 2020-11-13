<script>
  import ValueGraph from "./ValueGraph.svelte";

  export let dataLatest;
  export let dataStream;
  export let showGraph = false;

</script>


<!-- ------------------------------------------------------------ -->


<div class='payload-param' on:click={showGraph = !showGraph}>
  <div class='key-value-box'>
    <span class='param-key' style='color:{dataLatest.color}'>{dataLatest.key}</span>
    <span class='param-value'>{dataLatest.value}</span>
  </div>
  {#if showGraph}
    <div class='value-graph'><ValueGraph data={dataStream} height={40}/></div>
  {/if}
</div>


<!-- ------------------------------------------------------------ -->


<style>
 
  .payload-param {
    font-size: small;
    display: flex;
    flex-direction: column;
    /* flex-grow: 1; */
    border-bottom: 1px solid #0004;
    padding-top: 4px;
    padding-bottom: 4px;
    justify-content: space-between;
  }

  .key-value-box {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
  }

  .payload-param:hover {
    background-color: #0001;
  }

  .param-key {
    display: flex;
    flex-grow: 1;
    /* color: tomato; */
  }

  .param-value {
    font-variant-numeric: tabular-nums;
    text-align: right;
  }

  .value-graph {
    /* position: absolute; */
  }

</style>






