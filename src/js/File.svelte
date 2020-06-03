<script>
  import { onMount } from "svelte";

  export let title
  export let excerpt
  export let id

  export let selected = false;

  function openFile() {
    window.api.send("dispatch", { type: "OPEN_FILE", id: id });
  }
</script>

<style type="text/scss">
  div {
    border-bottom: 1px solid lightgray;
    padding: 0.5em;
    cursor: default;
  }

  h2,
  p {
    font-size: 0.8em;
    line-height: 1.5em;
    margin: 0;
    padding: 0;
  }

  p {
    font-size: 0.8em;
    color: gray;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .selected {
    background: rgb(45, 103, 250);
    h2 {
      color: white;
    }
    p {
      color: rgba(255, 255, 255, 0.8);
    }
  }
</style>

<div class:selected on:click={openFile}>
  <h2>{title}</h2>
  <p>{excerpt}</p>
</div>
