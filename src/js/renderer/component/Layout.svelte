<script>
  import { project, files } from '../StateManager'
  import FirstRun from './firstrun/FirstRun.svelte'
  import SideBar from './sidebar/SideBar.svelte'
  import Toolbar from './main/Toolbar.svelte'
  import Separator from './ui/Separator.svelte'
  import Menu from './ui/Menu.svelte'
  import Tooltip from './ui/Tooltip.svelte'
  import StateDisplay from './dev/StateDisplay.svelte'

  $: directoryIsSet = $project.directory
  $: filesPopulated = $files.tree

</script>


<style type="text/scss">
  @import '../../../styles/_mixins.scss';

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


<Menu />
<Tooltip />

{#if !directoryIsSet || !filesPopulated}
  <FirstRun />
{:else}
  <SideBar />
  <div id="main">
    <Toolbar />
    <Separator />
    <StateDisplay />
  </div>
{/if}
