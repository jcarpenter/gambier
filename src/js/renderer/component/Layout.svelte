<script>
  import { project } from '../StateManager'
  import { files } from '../FilesManager'
  import EditorPanels from './main/EditorPanels.svelte'
  import FirstRun from './firstrun/FirstRun.svelte'
  import FunctionalTests from './dev/FunctionalTests.svelte';
  import SideBar from './sidebar/SideBar.svelte'
  import Toolbar from './main/Toolbar.svelte'
  import Separator from './ui/Separator.svelte'
  import Menu from './ui/Menu.svelte'
  import Tooltip from './ui/Tooltip.svelte'
  import Colors from './dev/Colors.svelte'
  import UIElements from './dev/UIElements.svelte';
  import Files from './dev/Files.svelte'
  import State from './dev/State.svelte'
  import { setLayoutFocus } from './ui/actions';
  
  $: directoryIsSet = $project.directory
  $: filesPopulated = $files.tree
  $: isWindowDraggedOver = $project.window.isDraggedOver

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
    background-color: var(--windowBackgroundColor);
    transform: translate(250px, 0);
    position: absolute;
    display: flex;
    flex-direction: column;
    width: calc(100% - 250px);
    height: 100%;
  }

  #content {
    width: 100%;
    height: 100%;
    overflow: scroll;
  }
</style>

<svelte:window 
  on:dragover|preventDefault={onDragOver} 
  on:dragleave|preventDefault={onDragLeave} 
  on:drop|preventDefault={onDrop} 
/> 

<Tooltip />
<Menu />

<!-- <FunctionalTests /> -->

{#if !directoryIsSet}
  <FirstRun />
{:else}
  {#if filesPopulated}  
    <SideBar />
    <div 
      id="main" 
      use:setLayoutFocus={{current: $project.focusedSectionId, setTo: 'main'}}
    >
      <Toolbar />
      <Separator />
      <div id="content">
        <!-- <Colors /> -->
        <!-- <UIElements /> -->
        <!-- <State /> -->
        <!-- <Files /> -->
        <EditorPanels />
      </div>
    </div>
  {/if}
{/if}
