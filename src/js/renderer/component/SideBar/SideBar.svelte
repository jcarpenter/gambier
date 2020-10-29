<script>
  import { getSideBarItemById, isEmpty } from '../../utils'
  import { onMount } from 'svelte'
  import Project from './Project.svelte'
  import AllDocuments from './AllDocuments.svelte'
  import Separator from '../UI/Separator.svelte'

  export let state = {}
  export let focused

  $: tabs = state.sideBar2.tabs
  //   $: selectedTab = state.sideBar2.tabs.find((t) => t.active)

  function clickTab(evt, index) {
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_TAB_BY_INDEX',
      index: index,
    })
  }

  //   onMount(() => {})
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  #tabs {
    min-height: 30px;
    display: flex;
    justify-content: center;

    ul {
      padding: 0;
      margin: 0;
      list-style-type: none;
      display: flex;

      li {
        @include centered_background_image;
        list-style-type: none;
        margin: 0 12px 0 0;
        padding: 0;
        width: 15px;
        height: 15px;
        opacity: 60%;
        &.active {
          opacity: 100%;
        }
      }

      li:last-of-type {
        margin: 0;
      }
    }
  }

  // Icons
  .project {
    background-image: var(--img-folder);
  }
  .project.active {
    background-image: var(--img-folder-fill);
  }
  .all-documents {
    background-image: var(--img-doc-on-doc);
  }
  .all-documents.active {
    background-image: var(--img-doc-on-doc-fill);
  }
  .most-recent {
    background-image: var(--img-clock);
  }
  .most-recent.active {
    background-image: var(--img-clock-fill);
  }
  .tags {
    background-image: var(--img-tag);
  }
  .tags.active {
    background-image: var(--img-tag-fill);
  }
  .media {
    background-image: var(--img-photo);
  }
  .media.active {
    background-image: var(--img-photo-fill);
  }
  .citations {
    background-image: var(--img-quote-bubble);
  }
  .citations.active {
    background-image: var(--img-quote-bubble-fill);
  }
  .search {
    background-image: var(--img-magnifyingglass);
  }
  .search.active {
    background-image: var(--img-magnifyingglass);
  }
</style>

<div id="sidebar2" class:focused>
  <!-- Tabs -->
  <div id="tabs">
    <ul>
      {#each tabs as tab, index}
        <li
          on:click={(evt) => clickTab(evt, index)}
          class:active={index == state.sideBar2.activeTab.index}
          class={tab.name} />
      {/each}
    </ul>
  </div>

  <Separator />

  <!-- Sections -->
  <Project {state} {focused} />
  <AllDocuments {state} {focused} />
</div>
