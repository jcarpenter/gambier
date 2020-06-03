<script>
  import { onMount } from "svelte";

  export let details = {};

  export let selected = false;

  function openFile() {
    window.api.send("dispatch", { type: "OPEN_FILE", id: details.id });
  }

  function update(state) {
    selected = state.lastOpenedFileId === details.id;
  }

  window.api.receive("stateChanged", state => {
    update(state);
  });

  onMount(async () => {
    const state = await window.api.invoke("getState");
    update(state);
  });
</script>

<style type="text/scss">
  div {
    border-bottom: 1px solid lightgray;
    padding: 0.5em;
  }

  h2, p {
    font-size: 0.8em;
    line-height: 1.4em;
    margin: 0;
    padding: 0;
  }

  .selected {
    background: rgb(45, 103, 250);
    color: white;
  }
</style>

<div class:selected on:click={openFile}>
  <h2>{details.title}</h2>
  <p>{details.excerpt}</p>
</div>
