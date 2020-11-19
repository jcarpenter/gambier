<script>
  // import { slide } from 'svelte/transition'
  // import { linear, cubicOut } from 'svelte/easing'
	
	import { css } from '../../actions/css'
	import File from './File.svelte'
	import Row from './Row.svelte'
  import { state, files, sidebar } from '../../../StateManager.js'
  import { flip } from 'svelte/animate';
  import { standardEase } from '../../UI/easing'

	export let tree
	export let isRoot = false
  export let expandedHeight = 0
  export let top = 0
  export let isExpanded = true

	$: height = isExpanded ? expandedHeight : 0
	

  function scale(node, { duration = 100 }) {
    return {
      duration,
      easing: standardEase,
      css: (t, u) => `transform: scale(1, ${t})`,
    }
  }

  function counterScale(node, { duration = 100 }) {
    return {
      duration,
      easing: standardEase,
      css: (t, u) => `transform: scale(1, ${1 / t})`,
    }
	}

	function isExpandedFolder(id) {
		const file = $files.byId[id]
		const isFolder = file.type == 'folder'
  	const isExpandable = isFolder && file.numChildren
		const isExpanded = isExpandable && $sidebar.tabsById.project.expanded.some((id) => id == file.id)
		return isExpanded
	}
	
</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';

  .folder {
    --duration: 0;

    position: absolute;
		width: 100%;
    // contain: strict;
    // border: 2px solid rgba(255, 0, 0, 0.3);
    // height: calc(var(--height) * 1px);
    // overflow: hidden;
    // top: calc(var(--top) * 1px);
		// transition: height calc(var(--duration) * 1ms) step-end;
		
		&.isRoot {
			// We set `position: relative` on root folder, 
			// so `width: 100%` fits the parent div correctly.
			position: relative;
		}
  }

  .folder,
  .ul {
    // contain: strict;
    // position: absolute;
    transform-origin: left top;
    will-change: transform;
	}
	
	ul,
	li {
		@include reset-list;
	}

	li {
		position: relative;
		// width: calc(var(--sidebarWidth) * 1px);
		// background-color: rgba(255, 0, 255, 0.301);
		display: block;

		&.empty {
			height: 28px;
			pointer-events: none;
			visibility: hidden;
			margin-bottom: 1px;
		}
	}
</style>

<svelte:options immutable={true} />

<div class="folder" class:isRoot>
	<ul class="rows">
		{#each tree.children as row (row.id)}
			<li animate:flip={{duration: 100}} class:empty={row.id.includes('empty')}>
				{#if !row.id.includes('empty')}
					<File on:selectFile on:toggleExpanded id={row.id} />
					{#if isExpandedFolder(row.id)}
						<svelte:self
						tree={row}
						on:selectFile
						on:toggleExpanded/>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</div>

<!-- 
<div
  class="outer"
  transition:scale={{ duration: duration }}
  use:css={{ duration, height, top, itemWidth }}>
  <div transition:counterScale={{ duration: duration }} class="inner">
    <slot />
  </div>
</div> -->
