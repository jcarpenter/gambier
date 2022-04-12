<script lang='js'>
  import { files } from "../FilesManager";
  import { project, sidebar } from "../StateManager";
  import IconButton from "./ui/IconButton.svelte";
  import SearchField from "./ui/SearchField.svelte";
  import { setAsCustomPropOnNode } from './ui/actions'

  $: focusedPanel = $project.panels[$project.focusedPanelIndex]
  $: file = $files?.byId[focusedPanel?.docId]

  // We apply this to flex-basis property in style tag on
  // the sidebar element. If the sidebar is closed, we still
  // need a minimum width, to avoid overlap with window buttons.
  $: sidebarWidth = $sidebar.isOpen ? $sidebar.width : 116

  // Determine which icon to use
  // Icon variable is set as `--icon` css variable on the node.
  // (This is same as File.svelte)
  let icon = "" // 
  $: {
    if (file?.contentType?.includes('markdown')) {
      icon = "var(--project-markdown-icon)"
    } else if (file?.contentType?.includes('json')) {
      icon = "var(--project-json-icon)"
    } else if (file?.contentType?.includes('xml')) {
      icon = "var(--project-xml-icon)"
    } else if (file?.contentType?.includesAny('video', 'audio')) {
      icon = "var(--project-av-icon)"
    } else if (file?.contentType?.includesAny('image')) {
      icon = "var(--project-image-icon)"
    }
  }

</script>

<style lang="scss">

  #topbar {
    -webkit-app-region: drag;
    position: fixed;
    top: 0;
    left: 0;
    user-select: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    height: 36px;
    border-bottom: 1px solid var(--topbar-border-color);
  }

  #sidebar-block {
    overflow: visible;
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    padding-right: 4px;
    flex-grow: 0;
    flex-shrink: 0;
    // Flex basis is set in style tag on the element.
    transition: flex-basis var(--sidebar-openClose-duration) var(--macos-default-easing);

    #toggle-button-wrapper {
      right: 0;
    }
  }

  #main-block {
    flex-grow: 1;
    position: relative;
    padding-left: 4px;
    display: flex;
    align-items: center;
  }

  #focused-file {
    // Horizontally center inside #main-block
    position: absolute;
    transform: translate(-50%, -50%);
    left: 50%;
    top: 50%;
    display: flex;
    align-items: center;

    .icon {
      @include centered-mask-image;
      background-color: var(--label-2-color);
      width: 14px;
      height: 14px;
      margin-right: 6px; // Gap between icon and title
      margin-top: -1px; // Better vertically align with title
      pointer-events: none;
      -webkit-mask-image: var(--icon); // Set by `icon` variable
    }

    .title {
      @include system-regular-font;
      color: var(--primary-label-color);
      max-width: 20em;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }

    .unsavedChanges {
      @include system-regular-font;
      color: var(--label-2-color);
      white-space: nowrap;
    }
  }

  #left-area {
    flex-grow: 1;
    // position: absolute;
    // left: 0;
  }

  #right-area {
    // border: 1px solid gray;
    // position: absolute;
    // right: 0;
  }
</style>

<div 
  id="topbar"
>

<span id="focused-file">
  <span 
    class="icon"
    use:setAsCustomPropOnNode={{icon}}
  >
  </span>
  <span class="title">
    {#if file}
      {file.title ? file.title : file.name}
    {/if}
  </span>
  {#if focusedPanel.unsavedChanges}
    <span class="unsavedChanges">
    &nbsp;—&nbsp;Edited
    </span>
  {/if}
</span>

  <!-- This block aligns with the sidebar below -->

  <span 
    id="sidebar-block"
    style:flex-basis="{sidebarWidth}px"
  >
    <IconButton 
      tooltip={'Toggle Sidebar'} 
      icon={'toggle-sidebar-icon'} 
      padding={'0 8px'}
      on:mouseup={() => {
        window.api.send('dispatch', {
          type: 'SIDEBAR_SET_OPEN_CLOSED',
          value: !$project.sidebar.isOpen // Flip current value
        })
      }}
    />
  </span>

  <!-- This block aligns with the "main" area,
  which is everything to right of the sidebar. -->

  <span id="main-block">

    <span id="left-area">
      <!-- <IconButton 
        tooltip={'New Document'} 
        icon={'topbar-new-doc-icon'} 
        iconScale={0.8}
        padding={'0 8px'}
        on:mouseup={() => {
          window.api.send('dispatch', {
            type: 'CREATE_NEW_DOC'
          })
        }}
      /> -->
    </span>

    <!-- <span id="focused-file">
      <span 
        class="icon"
        class:doc={file?.isDoc}
        class:video={file?.contentType?.includes('video')}
        class:audio={file?.contentType?.includes('audio')}
        class:image={file?.contentType?.includes('image')}    
      >
      </span>
      <span class="title">
        {file?.title}
      </span>
      {#if focusedPanel.unsavedChanges}
        <span class="unsavedChanges">
        &nbsp;—&nbsp;Edited
        </span>
      {/if}
    </span> -->

    <span id="right-area">
      <!-- <SearchField icon='search-field-icon' style={'toolbar'} compact focused placeholder={'Search'} margin={'0 8px 0'} /> -->
    </span>
    
  </span>
</div>