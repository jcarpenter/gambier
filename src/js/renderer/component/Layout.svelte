<script>
  import { onMount } from 'svelte'
  import FirstRun from './FirstRun.svelte'
  import FlexPanel from './FlexPanel.svelte'
  import ToolBar from './ToolBar.svelte'
  import SideBar from './SideBar/SideBar.svelte'
  // import DocList from './DocList.svelte'
  import Editor from './Editor.svelte'
  import UITests from './UITests.svelte'
  import Separator from "./UI/Separator.svelte";

  export let state = {}
  export let oldState = {}

  let focusedSection

  $: isEditorVisible = state.openDoc.id

  function setLayoutFocus(section) {
    if (state.focusedLayoutSection == section) return
    window.api.send('dispatch', {
      type: 'SET_LAYOUT_FOCUS',
      section: section,
    })
  }
</script>

<style type="text/scss">
  #body {
    background-color: var(--windowBackgroundColor);
  }
</style>

<svelte:options accessors />

{#if state.projectPath == ''}
  <FirstRun />
{:else}
  <div class="flexContainerRow">
    <FlexPanel
      visible={state.sideBar.show}
      min={250}
      max={300}
      start={250}
      on:click={() => setLayoutFocus('navigation')}>
      <SideBar {state} focused={state.focusedLayoutSection == 'navigation'} />
    </FlexPanel>
    <div class="flexContainerColumn" id="body">
      <ToolBar {state} />
      <Separator />
      <!-- <UITests /> -->
    </div>

    <!-- {#if state.showFilesList}
      <FlexPanel
        min={260}
        max={360}
        start={280}
        on:click={() => setLayoutFocus('navigation')}>
        <DocList {state} {oldState} />
      </FlexPanel>
    {/if} -->
    <!-- <Editor
      state={state}
      visible={isEditorVisible}
      on:click={() => setLayoutFocus('editor')} /> -->
  </div>
{/if}
