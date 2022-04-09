<script lang='js'>
  export let src
  export let margin = '0 0 0 0'
</script>

<style lang="scss">
  .thumbnail {
    overflow: hidden;
    width: 100%;
    // background-color: white;
    // box-shadow: 0 0 3px 1px rgba(0, 0, 0, 0.08);
    height: 100%;
    // border: 1px solid var(--separator-color);
  }

  img {
    /* Scale the image so it covers whole area, thus will likely crop */
    width: 100%; 
    height: 100%;
    object-fit: contain;
    object-position: center;
  }
</style>

<div class="thumbnail" style="margin: {margin}">
  {#if src}
    <img {src} />
  {:else}
    <img src="placeholder" />
  {/if}
</div>
