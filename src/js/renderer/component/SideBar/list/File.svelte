<script>
  import { createEventDispatcher, afterUpdate } from 'svelte'
  import { state, project, files, sidebar } from '../../../StateManager'
  import { css } from '../../ui/actions'
  import {onMousedown, toggleExpanded} from './interactions'
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
  $: isExpandable = file?.type == 'folder'
  $: isFolder = $sidebar.tabsById.project.expanded.some((id) => id == file?.id)
  $: isSelected = $sidebar.tabsById.project.selected.some((id) => id == file?.id)
  $: isWindowFocused = $project.window.isFocused
  $: isWindowDraggedOver = $project.window.isDraggedOver
  $: isSectionFocused = $project.focusedLayoutSection == 'sidebar'

  $: isHighlighted = (isSelected && isWindowFocused && isSectionFocused && !isWindowDraggedOver) || isDragTarget
  $: isHighlightedInBg = (isSelected && isWindowFocused && !isSectionFocused) || (isSelected && !isWindowFocused) || (isSelected && isWindowDraggedOver && !isDragTarget)

</script>

<style type="text/scss">
  .file {
    contain: strict;
    user-select: none;
    border-radius: 4px;
    margin-bottom: 1px;
    width: 100%;
    height: 28px;

    .icon {
      @include centered_mask_image;
      @include absolute-vertical-center;
      background-color: var(--controlAccentColor);
      left: calc(calc(var(--leftOffset) * 1px) + 20px);
      width: 14px;
      height: 14px;
      pointer-events: none;
    }

    .label {
      @include label-normal;
      @include absolute-vertical-center;
      color: var(--labelColor);
      left: calc(calc(var(--leftOffset) * 1px) + 42px);
      white-space: nowrap;
      pointer-events: none;
    }

    .counter {
      @include absolute-vertical-center;
      @include label-normal;
      color: var(--tertiaryLabelColor);
      position: absolute;
      right: 7px;
      pointer-events: none;
    }
  }

  // Icons
  .folder .icon {
    -webkit-mask-image: var(--img-folder);
  }

  .doc .icon {
    -webkit-mask-image: var(--img-doc-text);
  }

  .img .icon {
    -webkit-mask-image: var(--img-photo);
  }

  .av .icon {
    -webkit-mask-image: var(--img-play-rectangle);
  }

  .file.isHighlighted {
    background-color: var(--selectedContentBackgroundColor);

    .disclosure [role='button'],
    .icon {
      background-color: var(--selectedMenuItemTextColor);
    }
    .label {
      color: var(--selectedMenuItemTextColor);
    }
    .counter {
      color: var(--controlColor);
      // opacity: 0.4;
    }
  }

  .file.isHighlightedInBg {
    background-color: var(--unemphasizedSelectedContentBackgroundColor);
  }

  // File is target of drag operation
  // File is seleted, app window is in foreground, and parent section is selected.
  // .file.isWindowDraggedOver.isDragTarget,
  // .file.isSelected.isSectionFocused.isWindowFocused:not(.isWindowDraggedOver) {
    
  //   background-color: var(--selectedContentBackgroundColor);

  //   .disclosure [role='button'],
  //   .icon {
  //     background-color: var(--selectedMenuItemTextColor);
  //   }
  //   .label {
  //     color: var(--selectedMenuItemTextColor);
  //   }
  //   .counter {
  //     color: var(--controlColor);
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
    use:css={{ leftOffset }}
    class="file {file.type}"
    class:isHighlighted
    class:isHighlightedInBg
    class:isFolder
    on:dragover|preventDefault|stopPropagation
    on:dragleave|preventDefault|stopPropagation
    on:drop|preventDefault|stopPropagation
    on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds)}
    >
      
    {#if isExpandable}
      <DisclosureButton
        width={14}
        height={14}
        padding={6}
        left={leftOffset + 3}
        rotation={isFolder ? 90 : 0}
        tooltip={'Toggle Expanded'}
        iconColor={isHighlighted ? 'white' : $state.appearance.os.colors.controlTextColor}
        on:toggle={() => toggleExpanded(id, isFolder, tab, tabId)} />

    {/if}
    <div class="icon" />
    <div class="label">{file.title ? file.title : file.name}</div>
    {#if isExpandable}
      <div class="counter">{file.numDescendants}</div>
    {/if}
  </div>
{/if}