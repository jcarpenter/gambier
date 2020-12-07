<script>
  import { project, files } from '../StateManager'
  import FirstRun from './firstrun/FirstRun.svelte'
  import SideBar from './sidebar/SideBar.svelte'
  import Toolbar from './main/Toolbar.svelte'
  import Separator from './ui/Separator.svelte'
  import Menu from './ui/Menu.svelte'
  import Tooltip from './ui/Tooltip.svelte'
  import StateDisplay from './dev/StateDisplay.svelte'
  import { setLayoutFocus } from './ui/actions';
  // import Editor from './main/Editor.svelte'

  $: directoryIsSet = $project.directory
  $: filesPopulated = $files.tree
  $: isWindowDraggedOver = $project.window.isDraggedOver

  /**
   * This function and the next set the `isDraggedOver` bool on the window.
   */
  function onDragOver() {
    if (!isWindowDraggedOver) {
      window.api.send('dispatch', { type: 'WINDOW_DRAG_OVER'})
    }
  }
  
  /**
   * We check the event `relatedTarget` to determine whether the user actually
   * dragged outside the window, or just dragged over a child element. The 
   * dragleave event fires in both cases, but we only care about the later.
   */
  function onDragLeave(evt) {
    if (isWindowDraggedOver && evt.relatedTarget == null) {
      window.api.send('dispatch', { type: 'WINDOW_DRAG_LEAVE'})
    }
  }

  function onDrop() {
    window.api.send('dispatch', { type: 'WINDOW_DRAG_LEAVE'})
  }
</script>

<style type="text/scss">
  #main {
    background-color: var(--windowBackgroundColor);
    // width: calc(100vw - 250px);
    transform: translate(250px, 0);
    overflow: scroll;
    position: absolute;
    // top: 0;
    // left: 0;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
  }
</style>

<svelte:window on:dragenter|preventDefault={onDragOver} on:dragleave|preventDefault={onDragLeave} on:drop|preventDefault={onDrop} /> 

<Menu />
<Tooltip />

{#if !directoryIsSet || !filesPopulated}
  <FirstRun />
{:else}
  <SideBar />
  <div id="main" use:setLayoutFocus={{current: $project.focusedLayoutSection, setTo: 'main'}}>
    <Toolbar />
    <Separator />
    <StateDisplay />
    <!-- <Editor /> -->
  </div>
{/if}
