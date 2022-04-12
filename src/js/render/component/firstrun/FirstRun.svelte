<script lang='js'>

function drop(evt) {
  const file = evt.dataTransfer.files[0]
  const type = file.type == '' ? 'folder' : file.type.includes('markdown') ? 'doc' : undefined
  
  if (type == 'folder') {
    window.api.send('dispatch', { 
      type: 'SET_PROJECT_DIRECTORY',
      directory: file.path
    })
  }
}

</script>

<style lang="scss">
  
  #firstrun {
    padding: 4rem;
    // background-color: var(--window-background-color);
    overflow: scroll;
    height: 100%;
  }

  h1 {
    @include title1-emphasized-text;
    color: var(--label-color);
  }

</style>

<!-- <svelte:body on:drop|preventDefault|stopPropagation={drop} /> -->

<div id="firstrun" on:dragover|preventDefault on:drop|preventDefault={drop}>
  <h1>Gambier</h1>

  <button
    on:click={() => {
      window.api.send('dispatch', { type: 'SELECT_PROJECT_DIRECTORY_FROM_DIALOG' })
    }}>
    Choose Project Folder...
  </button>
</div>
