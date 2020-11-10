<script>
  import { state, project } from '../StateManager'
  import FirstRun from './FirstRun.svelte'
  import SideBar from './SideBar/SideBar.svelte'
  import StateDisplay from './StateDisplay.svelte'
  import Toolbar from './Toolbar.svelte'
  import Separator from './UI/Separator.svelte'
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

<SideBar />

{#if $project.directory == ''}
  <FirstRun />
{:else}
  <div id="main" class="flexContainerColumn">
    <Toolbar />
    <Separator />
    <StateDisplay />
    <!-- <UITests /> -->
  </div>
{/if}
