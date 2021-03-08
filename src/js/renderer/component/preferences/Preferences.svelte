<script>
  import { isWindowFocused, state } from '../../StateManager';
  import Checkbox from '../ui/Checkbox.svelte';
  import Description from '../ui/Description.svelte';
  import FormRow from '../ui/FormRow.svelte';
  import Separator from '../ui/Separator.svelte';
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

  $: windowTitle = tabs.find(({ id }) => id == activeTab).title

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
    max-width: 600px;
    margin: 0 auto;
    height: 100%;
    padding: 20px;
    display: flex;
    flex-direction: column;
    // gap: 10px 0;
    overflow-x: hidden;
    overflow-y: scroll;
    // align-items: center;

    // For dark mode, we want the background to be a darker 
    // shade the usual windowBackgroundColor.
    @include dark { 
      filter: brightness(0.6);
      background: var(--windowBackgroundColor);
    }
    @include light {
      background: var(--windowBackgroundColor);
    }
  }

</style>

<div id="main" class:isWindowFocused={$isWindowFocused}>

   <!---------- FRAME ---------->

  <WindowFrame>
    <WindowTitleBar title={windowTitle} />
    <div class="toolbar">
      {#each tabs as {id, title, icon}}
        <ToolbarTab label={title} icon={icon} isSelected={id == activeTab} on:mouseup={() => activeTab = id}/>
      {/each}
    </div>
  </WindowFrame>
  

  <!---------- BODY ---------->

  <div class="window-body">

    {#if activeTab=='markup'} 
      
      <!-- Figures -->

      <FormRow label={'Figures:'} leftColumn={'200px'} margin={'8px 0 0'} multiLine={true} labelTopOffset={'3px'}>
        <Checkbox 
          label={'Implicit Figures'}
          checked={$state.markdown.implicitFigures}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              markdownOptions: {
                ...$state.markdown, 
                implicitFigures: !$state.markdown.implicitFigures
              }
            })
          }}
        />
        <Description margin={'4px 0 0 20px'}>
          An image with alt text on an empty line will be interpreted as a figure element. The image’s alt text will be used as the caption.
        </Description>  
      </FormRow>
      
      <FormRow leftColumn={'200px'} margin={'8px 0 0'}>
        <Checkbox 
          label={'Show Thumbnail'}
          disabled={!$state.markdown.implicitFigures}
          checked={true}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              markdownOptions: {
                ...$state.markdown, 
                implicitFigures: !$state.markdown.implicitFigures
              }
            })
          }}
        />
      </FormRow>

      <FormRow leftColumn={'200px'} margin={'4px 0 0'}>
        <Checkbox 
          label={'Show Caption'}
          disabled={!$state.markdown.implicitFigures}
          checked={true}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              markdownOptions: {
                ...$state.markdown, 
                implicitFigures: !$state.markdown.implicitFigures
              }
            })
          }}
        />
      </FormRow>


    {/if}

  </div>
</div>