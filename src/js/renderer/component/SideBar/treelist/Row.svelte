<script>
  import { afterUpdate } from 'svelte'
  import Expandable from '../../UI/Expandable.svelte'
  import { css } from '../../actions/css.js'
  import File from './File.svelte'
  import { flash } from '../../actions/flash.js'
  import { project, files, sidebar } from '../../../StateManager'

  export let item = {}
  export let isQueryEmpty = true

  let duration = 1000
  let itemWidth = 230
  let itemHeight = 28

  let file,
    isExpandable,
    isExpanded,
    isSelected,
    isSidebarFocused,
    numVisibleChildren

  $: {
    if (item.type !== 'Empty') {
      file = $files.byId[item.id]
      isExpandable =
        file.type == 'folder' && item.children && item.children.length
      isExpanded = $sidebar.tabsById.project.expanded.some(
        (id) => id == file.id
      )
      isSelected = $sidebar.tabsById.project.selected.some(
        (id) => id == file.id
      )
      isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

      numVisibleChildren = item.numVisibleChildren
    }
  }

  // $: yPos = item.indexInVisibleSiblings * itemHeight
  //   $: height = item.isExpanded ? (item.numVisibleChildren * itemHeight) + itemHeight : itemHeight

  // let div
  //   afterUpdate(() => {
  //     flash(div)
  //   })
</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';

  .row {
    --yPos: 0;
    --duration: 0;
    --itemWidth: 0;
    --itemHeight: 0;
    // width: calc(var(--width) * 1px);
    // height: calc(var(--height) * 1px);

    // contain: strict;
    // position: absolute;
    // transform: translate(0, calc(var(--yPos) * 1px));
    // transition: transform calc(var(--duration) * 1ms) var(--standardEase);

    &.empty {
      width: calc(var(--itemWidth) * 1px);
      height: calc(var(--itemHeight) * 1px);
    }
  }
</style>

<svelte:options immutable={true} />

{#if item.type == 'Empty'}
  <div class="row empty" use:css={{ itemWidth, itemHeight }} />
{:else}
  <div class="row" use:css={{ itemWidth, duration }}>
    <File
      on:selectFile
      on:toggleExpanded
      {item}
      {file}
      {itemWidth}
      {itemHeight}
      {isExpandable}
      {isExpanded}
      {isSelected}
      {isSidebarFocused} />

    <!-- {#if isQueryEmpty} -->
    {#if isExpandable && item.isExpanded}
      <Expandable
        {duration}
        {itemWidth}
        top={itemHeight}
        expandedHeight={numVisibleChildren * itemHeight}
        isExpanded={item.isExpanded}>
        {#each item.children as child (child.id)}
          <svelte:self
            item={child}
            {isSidebarFocused}
            {isQueryEmpty}
            on:selectFile
            on:toggleExpanded />
        {/each}
      </Expandable>
    {/if}
  </div>
{/if}
<!-- {/if} -->
