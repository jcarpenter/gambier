<script>
  import { state, project, sidebar } from '../../StateManager'
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
  import { onMount, onDestroy, tick } from 'svelte';

  let component
  let componentEl // tab component element

  $: {
    switch ($sidebar.activeTabId) {
      case 'project': component = Project; break
      case 'allDocs': component = AllDocuments; break
      case 'mostRecent': component = MostRecent; break
      case 'tags': component = Tags; break
      case 'media': component = Media; break
      case 'citations': component = Citations; break
      case 'search': component = Search; break
    } 
  }


  // ------- ON MOUNT ------- //

  let removeListenerMethods = []

  onMount(() => {

    // Setup listeners for menu commands

    const findInFiles = window.api.receive('findInFiles', () => {
      if ($sidebar.activeTabId !== 'search') {
        window.api.send('dispatch', {
          type: 'SHOW_SEARCH',
          inputToFocus: 'search',
        })
      }
    })

    const replaceInFiles = window.api.receive('replaceInFiles', () => {
      if ($sidebar.activeTabId !== 'search') {
        window.api.send('dispatch', {
          type: 'SHOW_SEARCH',
          inputToFocus: 'replace',
        })
      }
    })

    removeListenerMethods.push(findInFiles, replaceInFiles)
  })

  onDestroy(() => {
    // Remove `window.api.receive` listeners
    removeListenerMethods.forEach((remove) => remove())
  })


</script>

<style type="text/scss">
  #sidebar {
    --state-sideBarWidth: 100px;
    // background-color: var(--windowBackgroundColor);
    // background-color: transparent;
    // backdrop-filter: blur(8px);
    width: var(--state-sideBarWidth);
    height: 100%;
    position: absolute;
    margin: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--separator-color);

    & > div {
      max-height: 100%;
    }
  }

  #top-area {
    -webkit-app-region: drag;
    height: 40px;
    flex: none;
  }

  #tabs {
    height: 32px;
    flex: none;
    display: flex;
    justify-content: center;
    
    ul {
      @include list-reset;
      display: flex;
      gap: 6px;
      flex-direction: row;
      align-items: center;
    }
  }

  // We use :global to apply this to each `.section` child, to keep things DRY
  #sidebar > :global(.section){
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow-y: hidden;
    overflow-x: visible;
  }
</style>

<div 
  id ="sidebar" 
  style="--state-sideBarWidth: 252px" 
  use:setLayoutFocus={{current: $project.focusedSectionId, setTo: 'sidebar'}}
>
  
  <!-- Top area (draggable) -->
  <div id="top-area">
  </div>

  <!-- Tabs -->
  <div id="tabs">
    <ul>
      {#each $sidebar.tabsAll as id}
        <Tab {id} />
      {/each}
    </ul>
  </div>

  <Separator />

  <svelte:component bind:this={componentEl} this={component} />

  <!-- <Preview/> -->

</div>
