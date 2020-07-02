<script>
  import { onMount } from "svelte";
  import FirstRun from "./FirstRun.svelte";
  import FlexPanel from "./FlexPanel.svelte";
  import SideBar from "./SideBar.svelte";
  import FileList from "./FileList.svelte";
  import Editor from "./Editor.svelte";

  export let state = {};
  export let oldState = {};

  let focusedSection;

  $: isEditorVisible = state.openDoc.id

  function setLayoutFocus(section) {
    if (state.focusedLayoutSection == section) return
    window.api.send("dispatch", {
      type: "SET_LAYOUT_FOCUS",
      section: section
    });
  }

</script>

<style type="text/scss">
  @import "../../../styles/_variables.scss";

  .flexLayout {
    display: flex;
    width: 100%;
    height: 100%;
  }

  #mainSection {
    width: 100%;
    height: 100%;
  }

</style>

<svelte:options accessors />

{#if state.projectPath == ''}
  <FirstRun />
{:else}
  <div class="flexLayout">
    <FlexPanel
      visible={state.sideBar.show}
      min={160}
      max={220}
      start={180}
      on:click={() => setLayoutFocus('navigation')}>
      <SideBar state={state} />
    </FlexPanel>
    <div id="mainSection"></div>
    <!-- {#if state.showFilesList}
      <FlexPanel
        min={260}
        max={320}
        start={280}
        on:click={() => setLayoutFocus('navigation')}>
        <FileList state={state} oldState={oldState} />
      </FlexPanel>
    {/if}
    <div id="mainSection">
        <Editor
          state={state}
          visible={isEditorVisible}
          on:click={() => setLayoutFocus('editor')} />
    </div> -->
  </div>
{/if}