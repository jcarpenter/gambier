<script>
  import { project, sidebar } from '../../StateManager'

  import Project from './Project.svelte'
  import AllDocuments from './AllDocuments.svelte'
  
  import Separator from '../ui/Separator.svelte'
  import Tab from './Tab.svelte'
  import Preview from './Preview.svelte'
  
  // $: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  #sidebar {
    --state-sideBarWidth: 100px;
    // background-color: var(--windowBackgroundColor);
    width: var(--state-sideBarWidth);
    height: 100%;
    position: absolute;
    margin: 0;
    padding: 40px 0 0 0;
    display: flex;
    flex-direction: column;
    // overflow: hidden;
    border-right: 1px solid var(--separatorColor);

    & > div {
      max-height: 100%;
    }
  }

  #tabs {
    // position: fixed;
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
    }
  }
</style>

<div id="sidebar" style="--state-sideBarWidth: 250px">
  
  <!-- Tabs -->
  <div id="tabs">
    <ul>
      {#each $sidebar.tabsAll as id}
        <Tab {id} isActive={$sidebar.activeTabId == id} />
      {/each}
    </ul>
  </div>

  <Separator />

  <!-- Sections -->
  {#if $sidebar.activeTabId == 'project'}
    <Project />
  {:else if $sidebar.activeTabId == 'allDocs'}
    <AllDocuments />
  {:else if $sidebar.activeTabId == 'mosRecent'}
    Most Recent
  {:else if $sidebar.activeTabId == 'tags'}
    Tags
  {:else if $sidebar.activeTabId == 'media'}
    Media
  {:else if $sidebar.activeTabId == 'citations'}
    Citations
  {:else if $sidebar.activeTabId == 'search'}
    Search
  {/if}
  <!-- <AllDocuments {state} {focused} /> -->

  <Preview/>

</div>
