<script>
  //   import { onMount } from "svelte";

  export let text;
  // export let url;

  //   window.api.receive("stateChanged", state => {
  //     // update(state);
  //   });

  //   onMount(async () => {
  //     // const state = await window.api.invoke("getState");
  //     // update(state);
  //   });
</script>

<style type="text/scss">
  @import "../../../styles/_variables.scss";
  .link {
    box-sizing: border-box;
    color: var(--clr-blue);
    background-color: var(--clr-blue-lighter);
    padding: 0 0.2em 0 0.15em;
    border-radius: 0.15em;
    border: 1px solid var(--clr-blue-light);
  }
</style>

<span class="link">{text}</span>
