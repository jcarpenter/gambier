<script>
  import { createEventDispatcher, afterUpdate } from 'svelte'
  import { state, project, files, sidebar } from '../../../StateManager'
  import { css, dragIntoFolder } from '../../ui/actions'
  import {onMousedown, toggleExpanded} from './interactions'
  import DisclosureButton from '../../ui/DisclosureButton.svelte'
  import { getContext } from 'svelte';

  export let id = ''
	export let listIds = []
  export let nestDepth = 0  
  // export let isDraggedOver = false
  
	const tabId = getContext('tabId')
	$: tab = $sidebar.tabsById[tabId]
  $: file = $files.byId[id]
  $: isExpandable = file?.type == 'folder'
  $: isExpanded = $sidebar.tabsById.project.expanded.some((id) => id == file?.id)
  $: isSelected = $sidebar.tabsById.project.selected.some((id) => id == file?.id)
  $: leftOffset = nestDepth * 15
  $: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';

  // Shared
  .file {
    --leftOffset: 0;
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

  // Selection
  .file.isDraggedOver,
  .file.isSelected {
    
    // Selected, and parent list IS focused
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

    &.isSidebarFocused {
      background-color: var(--selectedContentBackgroundColor);
    }

    // Selected, and parent list NOT focused
    &:not(.isSidebarFocused) {
      background-color: var(--disabledControlTextColor);
    }
  }
</style>

<svelte:options immutable={true} />

<!-- use:listItem={{id, tabId, tab, listIds, isSelected}} -->
{#if file}
  <div
    use:css={{ leftOffset }}
    use:dragIntoFolder={{isFolder: isExpandable, folderPath: file.path}}
    class="file {file.type}"
    class:isSidebarFocused
    class:isSelected
    class:isExpanded
    on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds)}
    >
      
    {#if isExpandable}
      <DisclosureButton
        width={14}
        height={14}
        padding={6}
        left={leftOffset + 3}
        rotation={isExpanded ? 90 : 0}
        tooltip={'Toggle Expanded'}
        iconColor={isSelected ? 'white' : $state.appearance.os.colors.controlTextColor}
        on:toggle={() => toggleExpanded(id, isExpanded, tab, tabId)} />

    {/if}
    <div class="icon" />
    <div class="label">{file.title ? file.title : file.name}</div>
    {#if isExpandable}
      <!-- <div class="counter">{file.numDescendants}</div> -->
      <div class="counter">{file.numDescendants}</div>
    {/if}
  </div>
{/if}