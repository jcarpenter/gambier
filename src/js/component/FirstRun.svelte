<script>
  import { onMount } from 'svelte';
</script>

<style type='text/scss'>
  @import '../../styles/_variables.scss';

  #firstrun {
    padding: var(--grid-2);
    width: 100%;
    height: 100%;
    z-index: 100;
    position: fixed;
    background-color: white;

    h1 {
      @include label-large-bold;
    }

    h2 {
      @include label-normal;
      color: gray;
      margin: 4em 0 1em;
    }

    button {
      @include label-normal;
    }
  }
</style>

<div id='firstrun'>
  <h1>Gambier</h1>
  <h2>Get started:</h2>
  <button
    on:click={() => {
      window.api.send('selectProjectPath');
    }}>
    Choose Project Folder...
  </button>
</div>
