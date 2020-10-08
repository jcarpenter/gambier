<script>
</script>

<style type='text/scss'>
</style>

<div id='firstrun'>
  <h1>Gambier</h1>
  <h2>Get started:</h2>
  <button
    on:click={() => {
      window.api.send('dispatch', { type: 'SET_PROJECT_PATH' });
    }}>
    Choose Project Folder...
  </button>
</div>
