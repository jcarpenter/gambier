<script>
  import { project, files } from '../StateManager'
  import FirstRun from './FirstRun.svelte'
  import SideBar from './SideBar/SideBar.svelte'
  import StateDisplay from './StateDisplay.svelte'
  import Toolbar from './Toolbar.svelte'
  import Separator from './UI/Separator.svelte'

  $: directoryIsSet = $project.directory
  $: filesPopulated = $files.tree

  // console.log("--- Layout.svelte ---")
  // $: console.log(directoryIsSet)
  // $: console.log(filesPopulated)
  // $: console.log($project.directory)
  // $: console.log($files.tree)
  $: console.log($files)

</script>


<style type="text/scss">
  @import '../../../styles/_mixins.scss';

  #main {
    background-color: var(--windowBackgroundColor);
    width: calc(100vw - 250px);
    transform: translate(250px, 0);
    position: absolute;
    top: 0;
    left: 0;
  }
</style>


{#if !directoryIsSet || !filesPopulated}
  <FirstRun />
{:else}
  <SideBar />
  <div id="main" class="flexContainerColumn">
    <Toolbar />
    <Separator />
    <StateDisplay />
    <!-- <UITests /> -->
  </div>
{/if}
