<script lang='js'>
  import { store } from "../../../WizardManager"

  export let cm = null
  export let element = null
  export let suppressWarnings = false

  export let url = ''

</script>

<svelte:options accessors={true} />
<style lang="scss"></style>

<span 
  on:mouseenter={() => {
    // We don't allow user to mouse over url preview
    store.close()
  }}
>
  {url}
</span>