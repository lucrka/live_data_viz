<script>
  import Timeline from "./Timeline.svelte";
  import ValueBox from "./ValueBox.svelte";

  let colorTable = {
    red:'Red', r:'Red', 
    green:'LimeGreen', g:'LimeGreen', 
    blue:'DodgerBlue', b:'DodgerBlue', 
    yellow:'#EEc700', 
    orange:'DarkOrange', 
    violet:'MediumOrchid', 
    palette:['MediumVioletRed', 'OliveDrab', 'DeepSkyBlue', 'Chocolate', 'SlateBlue', 'Tomato', 'LightSeaGreen']
  }


  // get data of that user in form ['username', {data}]
  export let data = [];
  export let showGraphs = true;

  let dataLatest;
  let dataLatestPayload;
  let dataLatestPayloadArray = [];  // try to split up the string in values or key-value-pairs

  let dataByKey = {};

  $: {
    dataLatest = data[1][data[1].length - 1];
    //console.log(dataLatest);
    dataLatestPayload = dataLatest.origPayload;
    try {
      dataLatestPayload = JSON.parse(dataLatest.origPayload);
      dataLatestPayload = flattenObject(dataLatestPayload);
    } catch (error) {}
  
    dataLatestPayloadArray = JSON.stringify(dataLatestPayload).split(',');
    let paletteIndex = 0;
    for (let i = 0; i < dataLatestPayloadArray.length; i++) {
      let dat = dataLatestPayloadArray[i];
      dat = dat.split(':');

      let key, value;
      if (dat.length == 2) {
        key = clean(dat[0])
        value = clean(dat[1])
      } else {
        key = 'value_' + i;
        value = clean(dat[0])
      }
      let color = colorTable[key.toLowerCase()] ? colorTable[key.toLowerCase()] : colorTable.palette[paletteIndex++ % colorTable.palette.length];
      dataLatestPayloadArray[i] = {key:key, value:value, color:color};

      if (!dataByKey[key]) dataByKey[key] = [];
      dataByKey[key].push({timestamp:dataLatest.timestamp, value:value, color:color});
      removeOldEntries(dataByKey[key], 5000);
    }
    // console.log(dataByKey);
  }

  function removeOldEntries(arr, millis) {
    let now = Date.now();
    if (arr[0]) {
      while (arr[0].timestamp < now - millis) {
        arr.shift();
        if (!arr[0]) break;
      }
    }
  }


  function clean(str) {
    let result = str.match(/[\d\w\.\-]+/);
    if (result) return result[0];
    return false;
  }

  function flattenObject(obj, prefix) {
    if (!prefix) prefix = "";
    let res = {};
    for (let k in obj) {   
      switch (typeof obj[k]) {
        case "object":
          let tmp = flattenObject(obj[k], k + '_');
          for (let kk in tmp) {
            res[kk] = tmp[kk];
          }
          break;
        default:
          res[prefix + k] = obj[k];
      }
    }

    return res;
  }

</script>


<!-- ------------------------------------------------------------ -->

<div class='widget-box'>
  <div class='flex-container'>

    <div id='head' class='flex-item'>
      {data[0].toUpperCase()}
    </div>
  
    <div class='timeline flex-item'>
      <Timeline data={data[1]} height={10}/>
    </div>
  
    <div id='body' class='flex-item'>
      <!-- {JSON.stringify(dataLatestPayload, null, 2)} -->
      {#each dataLatestPayloadArray as dat} 
        <ValueBox dataLatest={dat} dataStream={dataByKey[dat.key]}/>
      {/each}
    </div>
  
  
  </div>
</div>


<!-- ------------------------------------------------------------ -->


<style>
  .widget-box {
    display: inline-block;
    background-color: white;
    /* border: 1px solid #0003; */
    border-radius: 0px;
    box-shadow: 2px 2px 5px #0003;
    margin: 10px;
    padding: 10px;
    width: 300px;
    overflow: hidden;
  }

  .flex-container {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    height: 400px;
  }

  .flex-item {
    display: flex;
    align-self: auto;
  }

  #head {
    font-weight: 700;
    flex-grow: 0;
    margin-bottom: 5px;
  }

  #body {
    /* word-wrap: break-word; */
    flex-grow: 1;
    /* margin-bottom: 10px; */
    flex-direction: column;
    /* align-items: stretch; */
    border-top: 1px solid #0004;
    /* border-bottom: 1px solid #0004; */
    width: 100%;
    overflow-y: scroll;
  }

  .timeline {
    flex-grow: 0;
    background-color: hsl(30deg, 100%, 100%);
    margin-bottom: 5px;
  }

</style>






