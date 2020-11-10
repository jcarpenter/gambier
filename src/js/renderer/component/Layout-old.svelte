<script>
  import { onMount } from 'svelte'
  import FirstRun from './FirstRun.svelte'
  import FlexPanel from './FlexPanel.svelte'
  import ToolBar from './ToolBar.svelte'
  import SideBar from './SideBar/SideBar.svelte'
  // import DocList from './DocList.svelte'
  import Editor from './Editor.svelte'
  import UITests from './UITests.svelte'
  import Separator from './UI/Separator.svelte'


  import { projectPath, focusedLayoutSection, sidebar, dispatch } from '../store.js'

  $: ({ isOpen, width } = $sidebar)


  // export let state = {}
  // export let oldState = {}

  // let focusedLayoutSection = ''
  // let showSideBar = true
  // let sideBarWidth = 200

  // $: onStateChange(state)

  // function onStateChange() {
  //   if (state.changed.includes('sideBar.isOpen')) {
  //     showSideBar = state.sideBar2.isOpen
  //   }

  //   if (state.changed.includes('focusedLayoutSection')) {
  //     focusedLayoutSection = state.focusedLayoutSection
  //   }
  // }

  // $: isEditorVisible = state.openDoc.id

  // function setLayoutFocus(section) {
  //   if (state.focusedLayoutSection == section) return
  //   window.api.send('dispatch', {
  //     type: 'SET_LAYOUT_FOCUS',
  //     section: section,
  //   })
  // }
</script>

<style type="text/scss">
  #main {
    background-color: var(--windowBackgroundColor);
    width: calc(100vw - 250px);
    transform: translate(250px, 0);
    position: absolute;
    top: 0;
    left: 0;
  }
</style>

<svelte:options accessors />

{#if $projectPath !== ''}
  <FirstRun />
{:else}
  



  <!--
  <div class="flexContainerRow">
    <FlexPanel
      visible={showSideBar}
      min={250}
      max={300}
      start={250}
      on:click={() => setLayoutFocus('sidebar')}>
      <SideBar {state} focused={focusedLayoutSection == 'sidebar'} />
    </FlexPanel>
    <div class="flexContainerColumn" id="body">
      <ToolBar {state} />
      <Separator />
      <UITests />
    </div>-->

  <!-- {#if state.showFilesList}
      <FlexPanel
        min={260}
        max={360}
        start={280}
        on:click={() => setLayoutFocus('navigation')}>
        <DocList {state} {oldState} />
      </FlexPanel>
    {/if} -->
{/if}
