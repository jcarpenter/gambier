<script>
  export let id
  export let isActive
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  li {
    @include centered_mask_image;
    background-color: var(--controlTextColor);
    list-style-type: none;
    margin: 0 12px 0 0;
    padding: 0;
    width: 14px;
    height: 14px;
    opacity: 70%;
    &.isActive {
      background-color: var(--controlAccentColor);
      opacity: 100%;
    }
  }

  li:last-of-type {
    margin: 0;
  }

  // Icons
  .project {
    -webkit-mask-image: var(--img-folder);
  }
  .project.isActive {
    -webkit-mask-image: var(--img-folder-fill);
  }
  .allDocs {
    -webkit-mask-image: var(--img-doc-on-doc);
  }
  .allDocs.isActive {
    -webkit-mask-image: var(--img-doc-on-doc-fill);
  }
  .mostRecent {
    -webkit-mask-image: var(--img-clock);
  }
  .mostRecent.isActive {
    -webkit-mask-image: var(--img-clock-fill);
  }
  .tags {
    -webkit-mask-image: var(--img-tag);
  }
  .tags.isActive {
    -webkit-mask-image: var(--img-tag-fill);
  }
  .media {
    -webkit-mask-image: var(--img-photo);
  }
  .media.isActive {
    -webkit-mask-image: var(--img-photo-fill);
  }
  .citations {
    -webkit-mask-image: var(--img-quote-bubble);
  }
  .citations.isActive {
    -webkit-mask-image: var(--img-quote-bubble-fill);
  }
  .search {
    -webkit-mask-image: var(--img-magnifyingglass);
  }
  .search.isActive {
    -webkit-mask-image: var(--img-magnifyingglass);
  }
</style>

<svelte:options immutable={true} />
<li
  on:click={() => window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_TAB_BY_ID',
      id: id,
    })}
  class:isActive
  class={id} />