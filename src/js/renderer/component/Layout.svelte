<script>
  import { project, sidebar } from '../StateManager'
  import { files } from '../FilesManager'
  import Background from './backgrounds/Background.svelte'
  import EditorPanels from './main/EditorPanels.svelte'
  import FirstRun from './firstrun/FirstRun.svelte'
  import SideBar from './sidebar/SideBar.svelte'
  import Toolbar from './main/Toolbar.svelte'
  import Separator from './ui/Separator.svelte'
  import Menu from './ui/Menu.svelte'
  import Tooltip from './ui/Tooltip.svelte'
  
  import { setAsCustomPropOnNode } from './ui/actions';
  import Lightbox from './main/Lightbox.svelte';
  import Wizard from './main/wizard/Wizard.svelte';
  import TopBar from './TopBar.svelte';
  import OverlayGrid from './dev/OverlayGrid.svelte';
  
  // Development-only. Components I use to help visualize data, state, etc.
  // import Colors from './dev/Colors.svelte'
  // import UIElements from './dev/UIElements.svelte';
  // import Files from './dev/Files.svelte'
  // import State from './dev/State.svelte'
  // import FunctionalTests from './dev/FunctionalTests.svelte';


  $: directoryIsSet = $project.directory
  $: filesPopulated = $files.tree
  $: isWindowDraggedOver = $project.window.isDraggedOver

  $: sidebarWidth = $sidebar.isOpen ? $sidebar.width : 0

  /**
   * This function and the next set the `isDraggedOver` bool on the window.
   */
  function onDragOver() {
    if (!isWindowDraggedOver) {
      window.api.send('dispatch', { type: 'PROJECT_WINDOW_DRAG_OVER'})
    }
  }
  
  /**
   * We check the event `relatedTarget` to determine whether the user actually dragged outside the window, or just dragged over a child element. The dragleave event fires in both cases, but we only care about the later.
   */
  function onDragLeave(evt) {
    if (isWindowDraggedOver && evt.relatedTarget == null) {
      window.api.send('dispatch', { type: 'PROJECT_WINDOW_DRAG_LEAVE'})
    }
  }

  function onDrop() {
    window.api.send('dispatch', { type: 'PROJECT_WINDOW_DRAG_LEAVE'})
  }

  
</script>

<style type="text/scss">

  #main {
    position: fixed;
    top: 36px;
    // Anchor #main to right, so changing width expands and 
    // collapses from right side. Makes it easier to animate 
    // (otherwise if it was anchored on left, we'd need to
    // animate both width -and- transform x.
    right: 0;
    transform: translate(-1, 0);
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    // Full width, minus sidebar
    width: calc(100% - calc(var(--sidebarWidth) * 1px));
    // Start where sidebar ends
    // transform: translate(calc(var(--sidebarWidth) * 1px), 0); 
    // transform-origin: left top;
    // Animate when sidebar opens/closes
    transition: width var(--sidebar-openClose-duration) var(--standard-ease);
  }
</style>

<svelte:window 
  on:dragover|preventDefault={onDragOver} 
  on:dragleave|preventDefault={onDragLeave} 
  on:drop|preventDefault={onDrop} 
/> 

<OverlayGrid />
<Tooltip />
<Menu />
<Wizard />
<Lightbox />
<!-- <FunctionalTests /> -->

{#if !directoryIsSet}
  <FirstRun />
{:else}
  {#if filesPopulated}
    <TopBar /> 
    {#if $sidebar.isOpen}
      <SideBar />
    {/if}
    <div 
      id="main" 
      use:setAsCustomPropOnNode={{sidebarWidth}}
    >
      <!-- <Toolbar /> -->
      <!-- <Separator /> -->
      <EditorPanels />
      <!-- <Colors /> -->
      <!-- <UIElements /> -->
      <!-- <State /> -->
      <!-- <Files /> -->
      <!-- <div id="content">
      </div> -->
    </div>
  {/if}
{/if}

<Background />
