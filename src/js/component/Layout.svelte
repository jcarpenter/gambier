<script>
  import { onMount } from "svelte";
  import FirstRun from "./FirstRun.svelte";
  import FlexPanel from "./FlexPanel.svelte";
  import SideBar from "./SideBar.svelte";
  import FileList from "./FileList.svelte";
  import Editor from "./Editor.svelte";

  export let state = {};

  let focusedSection;

</script>

<style type="text/scss">
  @import "../../styles/_variables.scss";

  .flexLayout {
    display: flex;
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
      on:click={() => (focusedSection = 'Navigation')}>
      <SideBar state={state} focused={focusedSection == 'Navigation'} />
    </FlexPanel>
    <FlexPanel
      visible={state.showFilesList}
      min={260}
      max={320}
      start={280}
      on:click={() => (focusedSection = 'Navigation')}>
      <FileList state={state} focused={focusedSection == 'Navigation'} />
    </FlexPanel>
    <Editor
      on:click={() => (focusedSection = 'Editor')}
      focused={focusedSection == 'Editor'} />
  </div>
{/if}