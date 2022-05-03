<script lang='js'>
  import { store } from "../../../WizardManager"

  // export let cm = null
  // export let element = null
  // export let suppressWarnings = false

  export let url = ''

</script>

<svelte:options accessors={true} />

<style lang="scss">
  div {
    padding: 5px 5px 20px;
    margin-right: 5px;
    min-width: 4em;
    max-width: 26em;
    height: 20px;
    display: block;
    text-overflow: ellipsis;
    overflow-x: hidden;
    white-space: nowrap;

    // background-color: accentColor();
    // color: white;
  }
</style>

<div 
  on:mouseenter={() => {
    // We don't allow user to mouse over url preview
    store.close()
  }}
>
  {url}
</div>