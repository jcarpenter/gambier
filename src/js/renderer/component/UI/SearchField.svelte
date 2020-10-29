<script>
  export let placeholder = 'Search'

  export let query = ''
  
  let input = null

  window.api.receive('findInFiles', selectInput)

  function selectInput() {
    input.select()
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .searchfield {
    @include label-normal;
    margin: 10px 10px 0;
    position: relative;
    background-color: rgba(0, 0, 0, 0.04);
    border-radius: 4px;
    min-height: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    // border: 1px solid black;

    &:focus-within {
      box-shadow: 0 0 0 2pt rgb(97, 163, 235);
    }
  }

  .magnifying-glass {
    @include centered_background_image;
    @include absolute-vertical-center;
    position: absolute;
    width: 13px;
    height: 13px;
    left: 5px;
    opacity: 0.4;
    background-image: var(--img-magnifyingglass);
  }

  .placeholder {
    @include absolute-vertical-center;
    color: var(--placeholderTextColor);
    left: 24px;
    pointer-events: none;
  }

  input {
    @include label-normal;
    margin: 1px 0 0 24px;
    width: 100%;
    background: transparent;
    outline: none;
    border: none;
  }
</style>

<div class="searchfield">
  <div on:mousedown|preventDefault={selectInput} class="magnifying-glass" />
  {#if !query}<span class="placeholder">{placeholder}</span>{/if}
  <input type="text" bind:this={input} bind:value={query} />
</div>
