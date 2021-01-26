<script>
  import { isWindowFocused } from '../../StateManager';
  import ToolbarTab from '../ui/ToolbarTab.svelte';
  import WindowFrame from '../ui/WindowFrame.svelte';
  import WindowTitleBar from '../ui/WindowTitleBar.svelte'; 

  let activeTab = 'general'

  let tabs = [
    {
      id: 'general',
      title: 'General',
      icon: 'img-gearshape'
    },
    {
      id: 'theme',
      title: 'Theme',
      icon: 'img-paintpalette-medium-regular'
    },
    {
      id: 'markup',
      title: 'Markup',
      icon: 'img-textformat-medium-regular'
    },
    {
      id: 'media',
      title: 'Media',
      icon: 'img-photo-medium-regular'
    },
    {
      id: 'citations',
      title: 'Citations',
      icon: 'img-quote-bubble-medium-regular'
    },
  ]

</script>

<style type="text/scss">

  #main {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .toolbar {
    display: flex;
    width: 100%;
    justify-content: center;
    height: 52px;
    gap: 2px;
  }

  .window-body {
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 10px 0;
    overflow-x: hidden;
    overflow-y: scroll;

    @include dark { 
      background: var(--controlBackgroundColor);
    }
    @include light {
      background: var(--windowBackgroundColor);
    }
  }

  .row {
    position: relative;
    margin-left: 40%;
    // outline: 1px solid pink;
  }

  .label {
    @include label-normal;
    // outline: 1px solid blue;
    position: absolute;
    left: -8px;
    color: var(--labelColor);
    transform: translate(-100%, 0);
    height: 20px;
    display: flex;
    align-items: center;
  }

  .label.secondary {
    opacity: 0.25;
  }

</style>

<div id="main" class:isWindowFocused={$isWindowFocused}>

   <!---------- FRAME ---------->

  <WindowFrame>
    <WindowTitleBar title={tabs.find((t) => t.id == activeTab).title} />
    <div class="toolbar">
      {#each tabs as {id, title, icon}}
        <ToolbarTab label={title} icon={icon} isSelected={id == activeTab} on:mouseup={() => activeTab = id}/>
      {/each}
    </div>
  </WindowFrame>
  

  <!---------- BODY ---------->

  <div class="window-body">

    <!-- TODO -->

  </div>
</div>