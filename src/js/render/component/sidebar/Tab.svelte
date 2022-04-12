<script lang='js'>
  import { sidebar, state } from '../../StateManager'
  import { setTooltip } from '../../TooltipManager'

  export let id
  
  $: tab = $sidebar.tabsById[id]
  $: selected = $sidebar.activeTabId == id
  $: tabindex = $state.system.keyboardNavEnabled ? 0 : -1

</script>

<style lang="scss">

  li {
    padding: 0;
    margin: 0;
    width: 20px;
    height: 20px;
    opacity: 70%;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;

    &::before {
      @include centered-mask-image;
      content: '';
      width: 14px;
      height: 14px;
      transform: translate(0, 0.5px);
      background-color: var(--sidebar-tab-inactive-color);
    }
  }
  
  li:active {
    &::before { background-color: var(--sidebar-tab-active-color); }
    opacity: 100%;
  }

  li.selected {
    &::before { background-color: var(--sidebar-tab-selected-color); }
    opacity: 100%;
  }

  li:focus {
    @include focusRingAnimation;
    outline: none;
  }

  // Icons
  .project::before {
    -webkit-mask-image: var(--nav-project-icon);
  }
  .project.selected::before {
    -webkit-mask-image: var(--nav-project-active-icon);
  }
  .allDocs::before {
    -webkit-mask-image: var(--nav-allDocs-icon);
  }
  .allDocs.selected::before {
    -webkit-mask-image: var(--nav-allDocs-active-icon);
  }
  .mostRecent::before {
    -webkit-mask-image: var(--nav-mostRecent-icon);
  }
  .mostRecent.selected::before {
    -webkit-mask-image: var(--nav-mostRecent-active-icon);
  }
  .tags::before {
    -webkit-mask-image: var(--nav-tags-icon);
  }
  .tags.selected::before {
    -webkit-mask-image: var(--nav-tags-active-icon);
  }
  .media::before {
    -webkit-mask-image: var(--nav-media-icon);
  }
  .media.selected::before {
    -webkit-mask-image: var(--nav-media-active-icon);
  }
  .citations::before {
    -webkit-mask-image: var(--nav-citations-icon);
  }
  .citations.selected::before {
    -webkit-mask-image: var(--nav-citations-active-icon);
  }
  .search::before {
    -webkit-mask-image: var(--nav-search-icon);
  }
  .search.selected::before {
    -webkit-mask-image: var(--nav-search-active-icon);
  }

</style>

<svelte:options immutable={true} />

<li
  class={`sidebar-tab ${id}`}
  on:click={() => window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_TAB_BY_ID',
      id: id,
    })}
  class:selected
  tabindex={tabindex}
  on:mousedown|preventDefault
  on:keydown={(evt) => {
    if (evt.code == 'Space') {
      evt.target.click()
    }
  }}
  use:setTooltip={{text: `Show ${tab.title}`, enabled: true}} 
/>