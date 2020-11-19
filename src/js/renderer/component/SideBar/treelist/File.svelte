<script>
  import { createEventDispatcher, afterUpdate } from 'svelte'
  import { project, files, sidebar } from '../../../StateManager'
  import { css } from '../../actions/css.js'
  import { flash } from '../../actions/flash.js'
  import DisclosureButton from '../../UI/DisclosureButton.svelte'
  const dispatch = createEventDispatcher()

  export let id
  export let item = {}
  // export let file = {}
  // export let itemWidth = 0
  // export let itemHeight = 0
  export let isExpandable = false
  // export let isExpanded = false
  export let isSelected = false
  export let isSidebarFocused = false

  $: file = $files.byId[id]
  $: isExpandable = file.type == 'folder' && file.numChildren
  $: isExpanded = $sidebar.tabsById.project.expanded.some((id) => id == file.id)
  $: isSelected = $sidebar.tabsById.project.selected.some((id) => id == file.id)
  $: leftOffset = (file.nestDepth - 1) * 15
  $: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'


</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';

  // Shared
  .file {
    --leftOffset: 0;
    contain: strict;
    border-radius: 4px;
    user-select: none;
    margin-bottom: 1px;
    width: 100%;
    height: 28px;
    background-color: rgba(219, 186, 186, 0.566);

    .icon {
      @include centered_mask_image;
      @include absolute-vertical-center;
      background-color: var(--controlAccentColor);
      left: calc(calc(var(--leftOffset) * 1px) + 20px);
      width: 14px;
      height: 14px;
    }

    .label {
      @include label-normal;
      @include absolute-vertical-center;
      color: var(--labelColor);
      left: calc(calc(var(--leftOffset) * 1px) + 42px);
      white-space: nowrap;
    }

    .counter {
      @include absolute-vertical-center;
      @include label-normal;
      color: var(--tertiaryLabelColor);
      position: absolute;
      right: 7px;
    }
  }

  // Icons
  .file {
    &.folder .icon {
      -webkit-mask-image: var(--img-folder);
    }

    &.doc .icon {
      -webkit-mask-image: var(--img-doc-text);
    }

    &.img .icon {
      -webkit-mask-image: var(--img-photo);
    }

    &.av .icon {
      -webkit-mask-image: var(--img-play-rectangle);
    }
  }

  // Selection
  .file.isSelected {
    // Selected, and parent list IS focused
    &.isSidebarFocused {
      background-color: var(--selectedContentBackgroundColor);
      .disclosure [role='button'],
      .icon {
        background-color: var(--controlColor);
      }
      .label {
        color: var(--selectedMenuItemTextColor);
      }
      .counter {
        color: var(--controlColor);
        opacity: 0.4;
      }
    }

    // Selected, and parent list NOT focused
    &:not(.isSidebarFocused) {
      background-color: var(--disabledControlTextColor);
    }
  }
</style>

<svelte:options immutable={true} />

<div
  use:css={{ leftOffset }}
  class="file {file.type}"
  class:isSidebarFocused
  class:isSelected
  class:isExpanded
  on:mousedown={(domEvent) => dispatch('selectFile', {
      file: file,
      isSelected: isSelected,
      domEvent: domEvent,
    })}>
    
  {#if isExpandable}
    <DisclosureButton
      width={14}
      height={14}
      padding={6}
      left={leftOffset + 3}
      rotation={isExpanded ? 90 : 0}
      tooltip={'Toggle Expanded'}
      iconColor={isSelected ? 'controlColor' : 'controlTextColor' }
      on:toggle={() => dispatch('toggleExpanded', {
          file: file,
          isExpanded: isExpanded,
        })} />

    <!-- <div class="disclosure">
      <div
        role="button"
        alt="Toggle Expanded"
        on:mousedown|stopPropagation={() => dispatch('toggleExpanded', {
            item: item,
            isExpanded: isExpanded,
          })} />
    </div> -->
  {/if}
  <div class="icon" />
  <div class="label">{file.name}</div>
  {#if isExpandable}
    <div class="counter">{file.numDescendants}</div>
  {/if}
</div>

<!-- on:click|stopPropagation={() => {
  console.log(item)
  console.log(file)
}} -->