<script>
  import { project, sidebar } from '../../StateManager'
  import { getSideBarItemById, isEmpty } from '../../utils'
  import { onMount } from 'svelte'

  import AllDocuments from './AllDocuments.svelte'
  import Preview from './Preview.svelte'
  import Project from './Project.svelte'
  import Separator from '../UI/Separator.svelte'
  import Tab from './Tab.svelte'
  
  $: focused = $project.focusedLayoutSection == 'sidebar'

</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  #sidebar {
    --state-sideBarWidth: 100px;
    background-color: var(--windowBackgroundColor);
    width: var(--state-sideBarWidth);
    height: 100%;
    position: fixed;
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

<div id="sidebar" class:focused style="--state-sideBarWidth: 250px">
  
  <!-- Tabs -->
  <div id="tabs">
    <ul>
      {#each $sidebar.tabs as tab}
        <Tab {tab} />
        <!-- <Tab {tab} on:click={() => toggle(tab.name)}/> -->
      {/each}
    </ul>
  </div>

  <Separator />

  <!-- Sections -->
  <Project />
  <!-- <AllDocuments {state} {focused} /> -->

  <!-- Preview -->
  <!-- <Preview {state} /> -->
</div>
