<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let item = {}
  export let listHasFocus = false
  export let isQueryEmpty = true

  let type = null

  $: isSelected = item.isSelected
  $: indexInLocalVisibleItems = item.indexAmongSiblings
  $: nestDepth = item.nestDepth
  $: isExpandable =
    item.type == 'folder' && item.children && item.children.length > 0
  $: isExpanded = isExpandable && item.isExpanded
  $: numberOfVisibleChildren = item.numberOfVisibleChildren

  $: {
    if (item.name == "Images and Figures") {
      console.log("nestDepth")
    }
  }

  // Set `type`
  $: {
    switch (item.type) {
      case 'folder':
      case 'doc':
        type = item.type
        break
      case 'media':
        switch (item.filetype) {
          case '.png':
          case '.jpg':
          case '.gif':
            type = 'image'
            break
          default:
            type = 'av'
            break
        }
        break
    }
  }
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  .wrapper {
    --indexInLocalVisibleItems: 0;
    --itemWidth: 230px;
    --itemHeight: 28px;
    --sidesPadding: 10px;
    --transitionSpeed: 300ms;

    position: absolute;
    transform: translate(
      0,
      calc(var(--indexInLocalVisibleItems) * var(--itemHeight))
    );
    // left: 0;
    transition: transform var(--transitionSpeed);
  }

  .item.folder .icon {
    -webkit-mask-image: var(--img-folder);
  }

  .item.doc .icon {
    -webkit-mask-image: var(--img-doc-text);
  }

  .item.image .icon {
    -webkit-mask-image: var(--img-photo);
  }

  .item.av .icon {
    -webkit-mask-image: var(--img-play-rectangle);
  }

  // Selected, and parent list IS focused
  .item.isSelected.listHasFocus {
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
  .item.isSelected:not(.listHasFocus) {
    background-color: var(--disabledControlTextColor);
  }

  // Shared
  .item {
    border-radius: 4px;
    --nestOffset: 0px;
    position: absolute;
    // min-height: 28px;
    user-select: none;
    margin-bottom: 1px;
    width: 230px;
    height: var(--itemHeight);

    .disclosure {
      @include absolute-vertical-center;
      left: calc(var(--nestOffset) + 5px);
      width: 10px;
      height: 10px;

      [role='button'] {
        @include centered_mask_image;
        -webkit-mask-image: var(--img-chevron-right);
        background-color: var(--controlTextColor);
        position: absolute;
        display: inline-block;
        top: 50%;
        left: 50%;
        width: 8px;
        height: 8px;
        transform: translate(-50%, -50%) rotateZ(0deg);
      }

      &.isExpanded [role='button'] {
        transform: translate(-50%, -50%) rotateZ(90deg);
      }
    }

    .icon {
      @include centered_mask_image;
      @include absolute-vertical-center;
      background-color: var(--controlAccentColor);
      left: calc(var(--nestOffset) + 20px);
      width: 14px;
      height: 14px;
    }

    .label {
      @include label-normal;
      @include absolute-vertical-center;
      color: var(--labelColor);
      left: calc(var(--nestOffset) + 42px);
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

  .children {
    --numberOfVisibleChildren: 0;
    position: absolute;
    transform: translate(0, var(--itemHeight)) scale(1, 1);
    // width: var(--itemWidth);
    // height: calc(var(--numberOfVisibleChildren) * var(--itemHeight));
    // background-color: rgba(117, 233, 169, 0.2);    
    // clip: rect(
    //   0,
    //   var(--itemWidth),
    //   calc(var(--numberOfVisibleChildren) * var(--itemHeight)),
    //   0
    // );
    // overflow: hidden;
    // transition: clip 250ms ease 0, height 0 step(0, end) 250ms;
    // transition: height var(--transitionSpeed);
  }

  .children:not(.isExpanded) {
    transform: scale(1, 0);
    // transition: height var(--transitionSpeed);
  }
</style>

<div
  class="wrapper"
  style={`--indexInLocalVisibleItems: ${indexInLocalVisibleItems}`}>
  <div
    style={`--nestOffset: ${(nestDepth - 1) * 15}px`}
    class="item {type}"
    on:mousedown={(domEvent) => dispatch('mousedown', {
        item: item,
        isSelected: isSelected,
        domEvent: domEvent,
      })}
    class:listHasFocus
    class:isSelected
    class:isExpandable>
    {#if isExpandable}
      <div class="disclosure" class:isExpanded>
        <div
          role="button"
          alt="Toggle Expanded"
          on:mousedown|stopPropagation={() => dispatch('toggleExpanded', {
              item: item,
              isExpanded: isExpanded,
            })} />
      </div>
    {/if}
    <div class="icon" />
    <div class="label">{item.name}</div>
    {#if isExpandable}
      <div class="counter">{item.children.length}</div>
    {/if}
  </div>

  <!-- {#if isQueryEmpty} -->
  {#if isExpandable}
    <div
      class:isExpanded
      class="children"
      style={`--numberOfVisibleChildren: ${numberOfVisibleChildren};`}>
      {#each item.children as child}
          <svelte:self
            item={child}
            listHasFocus
            isQueryEmpty
            on:mousedown
            on:toggleExpanded
            />
      {/each}
    </div> 
  {/if}
  <!-- {/if} -->
</div>

<!-- transition:slide|local={{ duration: 350 }} -->
