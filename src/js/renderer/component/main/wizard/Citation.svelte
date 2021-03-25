<script>
  import Separator from '../../ui/Separator.svelte';
  import { writeToDoc } from '../../../editor/editor-utils';
  import FormRow from '../../ui/FormRow.svelte';
  
  export let cm = null
  export let element = null

</script>

<style type="text/scss"></style>

<header>
  <h1>Citation</h1>
</header>

<!-- <Separator margin={'0 0 8px'} /> -->

<!------ DEFINITION ------>

<div class="definition">
  {element.markdown}
</div>

