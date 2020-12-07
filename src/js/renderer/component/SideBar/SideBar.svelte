<script>
  import { project, sidebar } from '../../StateManager'
  import Tab from './Tab.svelte'
  import Separator from '../ui/Separator.svelte'
  import Project from './Project.svelte'
  import AllDocuments from './AllDocuments.svelte'
  import MostRecent from './MostRecent.svelte'
  import Tags from './Tags.svelte'
  import Media from './Media.svelte'
  import Citations from './Citations.svelte'
  import Search from './Search.svelte'
  import Preview from './Preview.svelte'
  import { setLayoutFocus } from '../ui/actions';

  // $: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

</script>

<style type="text/scss">
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

  // We use :global to apply this to each `.section` child, to keep things DRY
  #sidebar :global(.section){
    display: flex;
    flex-direction: column;
    overflow-y: hidden;
    overflow-x: visible;
    flex-grow: 1;
  }
</style>

<div id="sidebar" style="--state-sideBarWidth: 250px" use:setLayoutFocus={{current: $project.focusedLayoutSection, setTo: 'sidebar'}}>
  
  <!-- Tabs -->
  <div id="tabs">
    <ul>
      {#each $sidebar.tabsAll as id}
        <Tab {id} />
      {/each}
    </ul>
  </div>

  <Separator />

  <!-- Sections -->
  {#if $sidebar.activeTabId == 'project'}
    <Project />
  {:else if $sidebar.activeTabId == 'allDocs'}
    <AllDocuments />
  {:else if $sidebar.activeTabId == 'mostRecent'}
    <MostRecent />
  {:else if $sidebar.activeTabId == 'tags'}
    <Tags />
  {:else if $sidebar.activeTabId == 'media'}
    <Media />
  {:else if $sidebar.activeTabId == 'citations'}
    <Citations />
  {:else if $sidebar.activeTabId == 'search'}
    <Search />
  {/if}

  <!-- <Preview/> -->

</div>
