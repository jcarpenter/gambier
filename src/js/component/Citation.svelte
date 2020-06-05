<script>
  //   import { onMount } from "svelte";

  export let text;
  export let url;

  //   window.api.receive("stateChanged", state => {
  //     // update(state);
  //   });

  //   onMount(async () => {
  //     // const state = await window.api.invoke("getState");
  //     // update(state);
  //   });
</script>

<style type="text/scss">
  .link {
    background: lightskyblue;
    border-radius: 2px;
  }
</style>

<span class="link">{text}</span>
