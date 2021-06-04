<script>
  import { store2 } from "../../../WizardManager"

  export let cm = null
  export let element = null
  export let suppressWarnings = false

  export let url = ''

</script>

<svelte:options accessors={true} />
<style type="text/scss"></style>

<span 
  on:mouseenter={() => {
    // We don't allow user to mouse over url preview
    store2.close()
  }}
>
  {url}
</span>