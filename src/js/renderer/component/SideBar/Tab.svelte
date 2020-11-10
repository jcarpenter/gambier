<script>
  export let tab
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
    &.active {
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
  .project.active {
    -webkit-mask-image: var(--img-folder-fill);
  }
  .all-documents {
    -webkit-mask-image: var(--img-doc-on-doc);
  }
  .all-documents.active {
    -webkit-mask-image: var(--img-doc-on-doc-fill);
  }
  .most-recent {
    -webkit-mask-image: var(--img-clock);
  }
  .most-recent.active {
    -webkit-mask-image: var(--img-clock-fill);
  }
  .tags {
    -webkit-mask-image: var(--img-tag);
  }
  .tags.active {
    -webkit-mask-image: var(--img-tag-fill);
  }
  .media {
    -webkit-mask-image: var(--img-photo);
  }
  .media.active {
    -webkit-mask-image: var(--img-photo-fill);
  }
  .citations {
    -webkit-mask-image: var(--img-quote-bubble);
  }
  .citations.active {
    -webkit-mask-image: var(--img-quote-bubble-fill);
  }
  .search {
    -webkit-mask-image: var(--img-magnifyingglass);
  }
  .search.active {
    -webkit-mask-image: var(--img-magnifyingglass);
  }
</style>

<svelte:options immutable={true} />
<li
  on:click={() => window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_TAB_BY_NAME',
      name: tab.name,
    })}
  class:active={tab.active}
  class={tab.name} />