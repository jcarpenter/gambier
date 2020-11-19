<script>
  // import { slide } from 'svelte/transition'
  // import { linear, cubicOut } from 'svelte/easing'
	
	import { css } from '../../actions/css'
	import File from './File.svelte'
	import Row from './Row.svelte'
  import { state, files, sidebar } from '../../../StateManager.js'
  import { flip } from 'svelte/animate';
  import { standardEase } from '../../UI/easing'
  import { slideUp } from '../../UI/transition'

	export let tree
	export let isRoot = false

	$: duration = $state.timing.treeListFolder
	
	// When the number of children changes, the height changes. This happens instantly, and can clip the child elements as they animate to their new positions. We could animate the height at the same duration and easing as the other transitions, but that's a big performance no-no. So instead we use `step` transitions to wait until the standard transition duration is complete, and then set the new value. OR we set it at the beginning. It depends on whether the folder has grown or shrunk. We determine -that- by comparing the new and old `numVisibleDescendants`.

	let oldNumVisibleDescendants = 0
	let folderHeight = 0
	let folderEasing = 0
	
	$: {
		if (tree.numVisibleDescendants !== oldNumVisibleDescendants) {
			const hasGrown = tree.numVisibleDescendants > oldNumVisibleDescendants
			folderEasing = hasGrown ? 'step-start' : 'step-end'
			folderHeight = tree.numVisibleDescendants * 29
			oldNumVisibleDescendants = tree.numVisibleDescendants
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
		--folderHeight: 0;
		--folderEasing: 0;
		--duration: 0;
		
    // contain: strict;
    position: absolute;
		width: 100%;
    overflow: hidden;
		height: calc(var(--folderHeight) * 1px);
		transition: height calc(var(--duration) * 1ms) var(--folderEasing);
		
		&.isRoot {
			// We set `position: relative` on root folder, 
			// so `width: 100%` fits the parent div correctly.
			position: relative;
		}
	}

  .folder,
  ul {
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

<div 
	use:css={{folderHeight, folderEasing, duration}}
	class="folder" 
	class:isRoot 
	>
	<ul class="rows" transition:slideUp|local={{ duration: duration }}>
		{#each tree.children as row (row.id)}
			<li animate:flip={{duration: duration, easing: standardEase}} class:empty={row.id.includes('empty')}>
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
