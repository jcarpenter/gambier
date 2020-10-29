<script>
  import { onMount } from 'svelte'

  export let state = {}
  export let item = {}
  export let nestDepth = 0

  let isSelected = false
  let isFolder = false
  let isExpandable = false
  let isExpanded = true

  $: label = item.type == 'doc' ? item.title : item.name
  $: isSelected = state.sideBar2.project.selectedItem.id == item.id
  $: isFolder = item.type == 'folder'
  $: isExpandable = isFolder && item.children.length > 0

  function clicked() {
    if (isSelected) return
    
    const copyOfItemWithoutChildren = Object.assign({}, item)
    copyOfItemWithoutChildren.children = []

    window.api.send('dispatch', {
      type: 'SELECT_SIDEBAR_PROJECT_ITEM',
      item: copyOfItemWithoutChildren,
    })
  }

  function toggleExpanded() {
    isExpanded = !isExpanded
    // window.api.send('dispatch', {
    //   type: 'TOGGLE_SIDEBAR_ITEM_EXPANDED',
    //   item: item,
    // });
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .item.folder .icon {
    background-image: var(--img-folder);
  }

  .item.doc .icon {
    background-image: var(--img-doc-text);
  }

  .item {
    position: relative;
    min-height: 28px;
    overflow: hidden;
    user-select: none;
    --nestOffset: 0px;
    
    // border: 1px solid rgba(255, 100, 0, 0.5) !important;
    // > * {
    //   outline: 1px solid rgba(255, 100, 0, 0.2) !important;
    // }

    &.isSelected {
      border-radius: 4px;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .disclosure {
      @include unstyled-button;
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 5px);
      width: 10px;
      height: 10px;

      [role='button'] {
        @include centered_background_image;
        background-image: var(--img-chevron-right);
        position: absolute;
        display: inline-block;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        transform: translate(-50%, -50%) rotateZ(0deg);
      }

      &.isExpanded [role='button'] {
        transform: translate(-50%, -50%) rotateZ(90deg);
      }
    }

    .icon {
      @include centered_background_image;
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 20px);
      width: 18px;
      height: 16px;
    }

    .label {
      @include label-normal;
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 42px);
      white-space: nowrap;
    }
  }

  .children:not(.isExpanded) {
    height: 0;
    overflow: hidden;
  }

  .children {
    transition: height 0.2s ease-out;
  }
</style>

<div
  style={`--nestOffset: ${nestDepth * 10}px`}
  class="item {item.type}"
  on:mousedown={clicked}
  class:isSelected
  class:isExpandable>
  {#if isExpandable}
    <div class="disclosure" class:isExpanded>
      <div
        role="button"
        alt="Toggle Expanded"
        on:mousedown|stopPropagation={toggleExpanded} />
    </div>
  {/if}
  <div class="icon" />
  <div class="label">{label}</div>
</div>

{#if isExpandable}
  <ul class:isExpanded class="children">
    {#each item.children as child}
      <li class="row">
        <svelte:self {state} item={child} nestDepth={nestDepth + 1} />
      </li>
    {/each}
  </ul>
{/if}
