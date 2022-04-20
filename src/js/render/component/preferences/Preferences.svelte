<script lang='js'>
  import { isWindowFocused, state } from '../../StateManager'
  import Checkbox from '../ui/Checkbox.svelte'
  import Description from '../ui/Description.svelte'
  import FormRow from '../ui/FormRow.svelte'
  import Menu from '../ui/Menu.svelte';
  import PopupButton from '../ui/PopupButton.svelte'
  import Separator from '../ui/Separator.svelte'
  import ToolbarTab from '../ui/ToolbarTab.svelte'
  import Tooltip from '../ui/Tooltip.svelte';
  import WindowFrame from '../ui/WindowFrame.svelte'
  import WindowTitleBar from '../ui/WindowTitleBar.svelte' 
  import EditorFontSize from './EditorFontSize.svelte';
  import EditorLineHeight from './EditorLineHeight.svelte';
  import EditorMaxLineWidth from './EditorMaxLineWidth.svelte';


  let activeTab = 'general'
  let tabs = [
    {
      id: 'general',
      title: 'General',
      icon: 'prefs-tab-general-icon'
    },
    {
      id: 'theme',
      title: 'Theme',
      icon: 'prefs-tab-theme-icon'
    },
    {
      id: 'markdown',
      title: 'Markdown',
      icon: 'prefs-tab-markdown-icon'
    },
    {
      id: 'media',
      title: 'Media',
      icon: 'prefs-tab-media-icon'
    },
    {
      id: 'citations',
      title: 'Citations',
      icon: 'prefs-tab-citations-icon'
    },
  ]

  $: windowTitle = tabs.find(({ id }) => id == activeTab).title

</script>

<style lang="scss">

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
    width: fit-content;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    overflow-x: hidden;
    overflow-y: scroll;
    background: var(--window-background-color);

    // Force all child rows into grid with two-columns,
    // to ensure that row contents align, regardless of
    // individual content sizes. This is a patter we
    // can use with FormRows.
    display: grid;
    grid-template-columns: auto fit-content(340px);
    row-gap: 8px;

    > :global(div.row) {
      // Ignore top-level FormRow div and access child
      // elements.
      display: contents;
    }
  }

</style>

<div id="main" class:isWindowFocused={$isWindowFocused}>

  <Tooltip />
  <Menu />

  <!---------- FRAME ---------->

  <WindowFrame>
    <WindowTitleBar title={windowTitle} />
    <div class="toolbar">
      {#each tabs as {id, title, icon}}
        <ToolbarTab 
          label={title} 
          icon={icon} 
          isSelected={id == activeTab} 
          on:click={() => activeTab = id}
        />
      {/each}
    </div>
  </WindowFrame>
  

  <div class="window-body">

    <!---------- GENERAL ---------->

    {#if activeTab=='general'} 

      <EditorFontSize/>
      <EditorLineHeight/>
      <EditorMaxLineWidth/>
    
    <!---------- markdown ---------->

    {:else if activeTab=='markdown'} 

      <!-- Strikethrough -->

      <FormRow label={'Strong delimiters:'} multiLine={true} labelTopOffset={'3px'}>
        <PopupButton 
          width='110px' 
          items={[
            { label: '**Hello**', id: '**', checked: true },
            { label: '__Hello__', id: '__', checked: false },
          ]} 
          on:selectItem={(evt) => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              options: {
                ...$state.markdown, 
                strongChar: evt.detail.item.id
              }
            })
            // updateOptions('lookIn', evt.detail.item.id)
          }}
        />
        <Description margin={'4px 0 0 20px'}>
          An image element with alt text on an empty line will be interpreted as a figure element, and can be displayed with an inline preview. The alt text will be used as caption text.
        </Description>  
      </FormRow>

      <!-- Strikethrough -->

      <FormRow label={'Strikethrough:'} multiLine={true} labelTopOffset={'3px'}>
        <Checkbox 
          label={'Strikethrough'}
          checked={$state.markdown.strikethrough}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              options: {
                ...$state.markdown, 
                strikethrough: !$state.markdown.strikethrough
              }
            })
          }}
        />
        <Description margin={'4px 0 0 20px'}>
          Use wrapping tilde characters to create strikethrough text: ~~Hello World~~.
        </Description>  
      </FormRow>

      <!-- Figures -->

      <FormRow label={'Figures:'} multiLine={true} labelTopOffset={'3px'}>
        <Checkbox 
          label={'Implicit Figures'}
          checked={$state.markdown.implicitFigures}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              options: {
                ...$state.markdown, 
                implicitFigures: !$state.markdown.implicitFigures
              }
            })
          }}
        />
        <Description margin={'4px 0 0 20px'}>
          An image element with alt text on an empty line will be interpreted as a figure element, and can be displayed with an inline preview. The alt text will be used as caption text.
        </Description>  
      </FormRow>
      
      <FormRow margin={'8px 0 0'}>
        <Checkbox 
          label={'Show Thumbnail'}
          disabled={!$state.markdown.implicitFigures}
          checked={true}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              options: {
                ...$state.markdown, 
                implicitFigures: !$state.markdown.implicitFigures
              }
            })
          }}
        />
      </FormRow>

      <FormRow margin={'4px 0 0'}>
        <Checkbox 
          label={'Show Caption'}
          disabled={!$state.markdown.implicitFigures}
          checked={true}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS',
              options: {
                ...$state.markdown, 
                implicitFigures: !$state.markdown.implicitFigures
              }
            })
          }}
        />
      </FormRow>


    {:else if activeTab=='media'} 

      <FormRow label={'Images:'} multiLine={true} labelTopOffset={'3px'}>
        <Checkbox 
          label={'Always copy image files into project'}
          checked={$state.markdown.strikethrough}
          on:click={() => {
            window.api.send('dispatch', {
              type: 'SET_MARKDOWN_OPTIONS'
            })
          }}
        />
        <Description margin={'4px 0 0 20px'}>
          When selected, image files dropped into the project from the file system will always be copied. Otherwise they will be moved by default, and copied only if the Option key is held.
        </Description>  
      </FormRow>

    {/if}

  </div>
</div>