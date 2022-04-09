<script lang='js'>
  import { createEventDispatcher, afterUpdate } from 'svelte'
  import { state, project, sidebar, isWindowFocused } from '../../../StateManager'
  import { files } from '../../../FilesManager'
  import { setAsCustomPropOnNode } from '../../ui/actions'
  import {onMousedown, toggleExpanded, onMouseup} from './interactions'
  import DisclosureButton from '../../ui/DisclosureButton.svelte'
  import { getContext } from 'svelte';

  export let id = ''
	export let listIds = []
  export let nestDepth = 0  
  export let isDragTarget = false

  
	const tabId = getContext('tabId')
	$: tab = $sidebar.tabsById[tabId]
  $: file = $files.byId[id]
  $: leftOffset = nestDepth * 15
  $: isExpandable = file?.isFolder
  $: isExpanded = $sidebar.tabsById.project.expanded.some((id) => id == file?.id)
  $: isSelected = $sidebar.tabsById.project.selected.some((id) => id == file?.id)
  // TODO ^ Update to new system
  $: isWindowDraggedOver = $project.window.isDraggedOver
  $: isSectionFocused = $project.focusedSectionId == 'sidebar'

  $: isHighlighted = ($isWindowFocused && isSelected && isSectionFocused && !isWindowDraggedOver) || isDragTarget
  $: isHighlightedInBg = ($isWindowFocused && isSelected && !isSectionFocused) || (isSelected && !$isWindowFocused) || (isSelected && isWindowDraggedOver && !isDragTarget)

  // Determine which icon to use
  // Icon variable is set as `--icon` css variable on the node.
  let icon = "" // 
  $: {
    if (file?.isFolder) {
      icon = "var(--project-folder-icon)"
    } else if (file?.contentType?.includes('markdown')) {
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

  /**
   * On drag start, if the dragged file is a doc, set it's 
   * id as a dataTransfer item. We use custom `text/docid`.
   * Per: https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations#dragdata
   * @param domEvent
   */
  function onDragStart(domEvent) {
    const file = $files.byId[id]
    // console.log(file)
    if (file.isDoc) {
      domEvent.dataTransfer.setData('text/docid', id);
    } else if (file.isMedia) {
      domEvent.dataTransfer.setData('text/mediaid', id);
    }
  }

</script>

<style lang="scss">='text/scss'>
  .file {
    contain: strict;
    user-select: none;
    border-radius: 4px;
    margin-bottom: 1px;
    width: 100%;
    height: 28px;
    display: flex;
    align-items: center;

    .icon {
      @include centered-mask-image;
      @include absolute-vertical-center;
      background-color: var(--sidebar-tree-icons-color);
      left: calc(calc(var(--leftOffset) * 1px) + 20px);
      width: 14px;
      height: 14px;
      pointer-events: none;
      -webkit-mask-image: var(--icon); // Set by `icon` variable
    }

    .label {
      @include system-regular-font;
      @include absolute-vertical-center;
      color: var(--label-color);
      left: calc(calc(var(--leftOffset) * 1px) + 42px);
      white-space: nowrap;
      pointer-events: none;
    }

    .counter {
      @include absolute-vertical-center;
      @include system-regular-font;
      color: var(--label-3-color);
      position: absolute;
      right: 7px;
      pointer-events: none;
    }
  }

  .file.isHighlighted {
    background-color: var(--selected-list-item-color);

    .disclosure [role='button'],
    .icon {
      background-color: var(--menuitem-selected-text-color);
    }
    .label {
      color: var(--menuitem-selected-text-color);
    }
    .counter {
      color: var(--menuitem-selected-text-color);
      opacity: 0.6;
    }
  }

  .file.isHighlightedInBg {
    background-color: foregroundColor(0.12);
  }

  // File is target of drag operation
  // File is seleted, app window is in foreground, and parent section is selected.
  // .file.isWindowDraggedOver.isDragTarget,
  // .file.isSelected.isSectionFocused.isWindowFocused:not(.isWindowDraggedOver) {
    
  //   background-color: var(--selected-list-item-color);

  //   .disclosure [role='button'],
  //   .icon {
  //     background-color: var(--menuitem-selected-text-color);
  //   }
  //   .label {
  //     color: var(--menuitem-selected-text-color);
  //   }
  //   .counter {
  //     color: var(--control-selected-text-color);
  //     // opacity: 0.4;
  //   }
  // }

  // File is selected, but a drag is active and this File is not the targt.
  // File is selected, but the app or the parent section are not.
  // .file.isSelected.isWindowDraggedOver:not(.isDragTarget),
  // .file.isSelected:not(.isWindowFocused),
  // .file.isSelected:not(.isSectionFocused) {
  //   background-color: var(--unemphasizedSelectedContentBackgroundColor);
  // }
</style>

<svelte:options immutable={true} />

<!-- use:listItem={{id, tabId, tab, listIds, isSelected}} -->
<!-- use:dragIntoFolder={{isFolder: isExpandable, folderPath: file.path}} -->
{#if file}
  <div
    use:setAsCustomPropOnNode={{ leftOffset }}
    use:setAsCustomPropOnNode={{icon}}
    class="file"
    class:isHighlighted
    class:isHighlightedInBg
    draggable=true
    on:dragstart={onDragStart}
    on:dragover|preventDefault|stopPropagation
    on:dragleave|preventDefault|stopPropagation
    on:drop|preventDefault|stopPropagation
    on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds, $files)}
    on:mouseup={(evt) => onMouseup(evt, id, tab, tabId, $project.panels[$project.focusedPanelIndex], $files)}
    >
      
    {#if isExpandable}
      <DisclosureButton
        width={'14px'}
        height={'14px'}
        padding={'3px'}
        left={leftOffset + 3}
        rotation={isExpanded ? 0 : -90}
        opacity={0.85}
        iconColor={isHighlighted ? 'menuitem-selected-text-color' : 'control-text-color'}
        on:toggle={() => toggleExpanded(id, isExpanded, tab, tabId)} 
      />
    {/if}
    <div class="icon" />
    <div class="label">{file.title ? file.title : file.name}</div>
    {#if isExpandable}
      <div class="counter">{file.numDescendants}</div>
    {/if}
  </div>
{/if}