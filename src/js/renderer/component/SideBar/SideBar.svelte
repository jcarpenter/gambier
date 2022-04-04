<script>
  import { project, sidebar } from '../../StateManager'
  import Tab from './Tab.svelte'
  import Separator from '../ui/Separator.svelte'
  import Project from './Project.svelte'
  import AllDocuments from './AllDocuments.svelte'
  import MostRecent from './MostRecent.svelte'
  import Tags from './Tags.svelte'
  import Media from './Media.svelte'
  // import Citations from './Citations.svelte' // 3/15/22: Disabled  
  import Search from './Search.svelte'
  import Preview from './Preview.svelte'
  import { setLayoutFocus, setAsCustomPropOnNode } from '../ui/actions';
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { getCssProp, throttle } from '../../../shared/utils';
  import { mask } from '../ui/transition';

  let component // Component to render
  let componentEl // Rendered component DOM element

  // We set `sidebarWidth` as a custom property on #sidebar
  $: sidebarWidth = $sidebar.width

  $: {
    switch ($sidebar.activeTabId) {
      case 'project': component = Project; break
      case 'allDocs': component = AllDocuments; break
      case 'mostRecent': component = MostRecent; break
      case 'tags': component = Tags; break
      case 'media': component = Media; break
      // case 'citations': component = Citations; break
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
          type: 'SIDEBAR_SHOW_SEARCH_TAB',
          inputToFocus: 'search',
        })
      }
    })

    const replaceInFiles = window.api.receive('replaceInFiles', () => {
      if ($sidebar.activeTabId !== 'search') {
        window.api.send('dispatch', {
          type: 'SIDEBAR_SHOW_SEARCH_TAB',
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

  function resizeEnd(evt) {
    // We don't want mouseup event (which triggers this function)
    // to trigger mouseup on sidebar file list items (or other)
    // UI elements. So we catch the event on the capture phase
    // by setting `true` on the listener, and we then call
    // evt.stopPropagation() to stop the event processing beyond
    // this element.
    evt.stopPropagation()
    window.removeEventListener('mouseup', resizeEnd, true)
    window.removeEventListener('mousemove', setWidth, false)
  }


  const setWidth = throttle(25, (evt) => {
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_WIDTH',
      value: evt.clientX + 5
    })  
  })

</script>

<style type="text/scss">
  #sidebar {
    position: fixed;
    width: calc(var(--sidebarWidth) * 1px);
    height: calc(100% - 36px);
    top: 36px;
    left: 0;
    margin: 0;
    transform-origin: left top;
    overflow: hidden;
    // border-right: var(--sidebar-border-width) solid var(--separator-color);

    // Transparent sidebar style:
    // background-color: var(--window-background-color);
    // background-color: transparent;
    // backdrop-filter: blur(8px);
  }

  .children {
    transform-origin: left top;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
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

  // Can't recall why we have this. Maybe scrolling related?
  #sidebar .children > div {
    max-height: 100%;
  }

  // We use :global to apply this to each `.section` child, to keep things DRY
  #sidebar .children > :global(.section){
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    overflow-y: hidden;
    overflow-x: visible;
  }

  // We "drag" this element to trigger sidebar resizes
  #resize {
    cursor: col-resize;
    position: absolute;
    top: 0;
    right: 0;
    width: 5px;
    height: 100%;
  }
</style>

<div 
  id="sidebar"
  class="parent"
  use:setLayoutFocus={{current: $project.focusedSectionId, setTo: 'sidebar'}}
  use:setAsCustomPropOnNode={{sidebarWidth}}
  transition:mask={{ 
    thisNodeIsMask: true,
    direction: 'x',
    duration: getCssProp('--sidebar-openClose-duration')
  }}
>

  <Separator margin={'0 12px'} />

  <!-- 
    We use wrapper 'parent' and 'children' elements for sake
    of the masking transition (we need both).
   -->
  <div 
    class="children"
    transition:mask={{
      thisNodeIsMask: false,
      direction: 'x',
      duration: getCssProp('--sidebar-openClose-duration')
    }}
  >
    <!-- Tabs -->
    <div id="tabs">
      <ul>
        {#each $sidebar.tabsAll as id}
          <Tab {id} />
        {/each}
      </ul>
    </div>
    <!-- Seperator -->
    <Separator margin={'0 12px'} />
    <!-- The rendered tab component -->
    <svelte:component this={component} bind:this={componentEl} />
  </div>

  <!-- 
    This element handles resizing. When the user mouses down and 
    starts to move, we send resize events to store (throttled
    slightly, so we don't swamp the IPC, which may be premature
    optimization on my part). 
   -->
  <div 
    id="resize"
    on:mousedown|preventDefault={() => {
      window.addEventListener('mouseup', resizeEnd, true)
      window.addEventListener('mousemove', setWidth, false)
    }}
    on:dblclick={() => {
      window.api.send('dispatch', {
        type: 'SIDEBAR_SET_WIDTH',
        value: get(sidebar).defaultWidth
      })
    }}
  >
  </div>

  <!-- <Preview/> -->

</div>
