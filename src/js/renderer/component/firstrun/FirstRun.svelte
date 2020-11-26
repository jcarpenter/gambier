<script>
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  #firstrun {
    padding: 4rem;
    background-color: var(--windowBackgroundColor);
    overflow: scroll;
  }

  h1 {
    @include label-large-bold;
    color: var(--labelColor);
  }

  h2 {
    @include label-normal;
    color: var(--secondaryLabelColor);
  }

</style>

<div id="firstrun">
  <h1>Gambier</h1>

  <button
    on:click={() => {
      window.api.send('dispatch', { type: 'SELECT_PROJECT_DIRECTORY' })
    }}>
    Choose Project Folder...
  </button>
</div>
