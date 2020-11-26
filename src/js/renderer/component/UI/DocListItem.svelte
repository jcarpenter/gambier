<script>
  import { onMount } from "svelte";
  import { fade, fly } from 'svelte/transition';

  export let state = {}
  export let selected = false
  export let title = ''
  export let excerpt = ''

  $: focused = state.focusedLayoutSection == 'navigation'

</script>

<style type="text/scss">
</style>

<div
    class="doc"
    class:focused
    class:selected
    on:click|preventDefault
    tabindex="0">
    <h2>{title}</h2>
    <p>{excerpt}</p>
    <!-- <hr /> -->
</div>