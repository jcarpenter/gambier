<svelte:options accessors={true}/>

<script lang='js'>
  //   import { onMount } from "svelte";

  export let element
  export let input
  export let visible = false
  export let from = { line: 0, ch: 0 }

  export const show = () => {
      input = ""
      visible = true
  }

  //   window.api.receive("stateChanged", state => {
  //     // update(state);
  //   });

  //   onMount(async () => {
  //     // const state = await window.api.invoke("getState");
  //     // update(state);
  //   });
</script>

<style lang="scss">
  @import "../../../styles/_variables.scss";
  .link {
    position: absolute;
    box-sizing: border-box;
    color: var(--clr-blue);
    background-color: var(--clr-blue-lighter);
    padding: 0 0.2em 0 0.15em;
    border-radius: 0.15em;
    border: 1px solid var(--clr-blue-light);
    z-index: 10;
    transform: translate(50%, 0%);
  }
</style>

<div bind:this={element} class="link">{input}</div>

<!-- <div bind:this={element} class="link">
    <select name="pets" multiple size="3">
        <option value="link">Link</option>
        <option value="document">Document</option>
        <option value="citation">Citation</option>
    </select>
</div> -->
