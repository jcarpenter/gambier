<script>
  import { getSideBarItemById, isEmpty } from '../../utils'
  import { onMount } from 'svelte'
  // SideBar
  import Preview from './Preview.svelte'
  import Project from './Project.svelte'
  import AllDocuments from './AllDocuments.svelte'
  // UI
  import Separator from '../UI/Separator.svelte'

  export let state = {}
  export let focused

  $: tabs = state.sideBar2.tabs

  function clickTab(evt, index) {
    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_TAB_BY_INDEX',
      index: index,
    })
  }

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  #sidebar2 {
    width: 100%;
    height: 100%;
    position: relative;
    margin: 0;
    padding: 40px 0 0 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid var(--separatorColor);

    & > div {
      max-height: 100%;
    }
  }

  #tabs {
    min-height: 30px;
    display: flex;
    justify-content: center;

    ul {
      padding: 0;
      margin: 0;
      list-style-type: none;
      display: flex;
      flex-direction: row;
      align-items: center;

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
    }
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
  
  <!-- Preview -->
  <Preview {state} />
</div>
