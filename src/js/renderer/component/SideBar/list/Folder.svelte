<script>
	import File from './File.svelte'
	import { state, files, sidebar } from '../../../StateManager.js'
	import { flip } from 'svelte/animate';
	import { css } from '../../ui/actions'
	import { standardEase } from '../../ui/easing'
	import { slideUp } from '../../ui/transition'
  import { getContext } from 'svelte';

	export let subtree	
	export let listIds
	export let isRoot = true
	export let nestDepth = 0
	
	const tabId = getContext('tabId')
	$: duration = $state.timing.treeListFolder
	
	// When the number of children changes, the height changes. This happens instantly, and can clip the child elements as they animate to their new positions. We want to avoid that. We could animate the height at the same duration and easing as the other transitions, but that's a big performance no-no. So instead we use `step` transitions to wait until the standard transition duration is complete, and then set the new value. OR we set it at the beginning. It depends on whether the folder has grown or shrunk. We determine -that- by comparing the new and old `numVisibleDescendants`.

	let oldNumVisibleDescendants = 0
	let folderHeight = 0
	let folderEasing = 0
	
	$: {
		if (subtree.numVisibleDescendants !== oldNumVisibleDescendants) {
			const hasGrown = subtree.numVisibleDescendants > oldNumVisibleDescendants
			folderEasing = hasGrown ? 'step-start' : 'step-end'
			folderHeight = subtree.numVisibleDescendants * 29
			oldNumVisibleDescendants = subtree.numVisibleDescendants
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
		@include list-reset;
	}

	li {
		position: relative;
		display: block;

		&.empty {
			height: 28px;
			pointer-events: none;
			visibility: hidden;
			margin-bottom: 1px;
		}
	}
</style>

<!-- <svelte:options immutable={false} /> -->

<div 
	class="folder" 
	use:css={{folderHeight, folderEasing, duration}}
	class:isRoot 
	>
	<ul class="rows" transition:slideUp|local={{ duration: isRoot ? 0 : duration }}>
		{#each subtree.children as child (child.id)}
			<li animate:flip={{duration: duration, easing: standardEase }} class:empty={child.id.includes('empty')}>
				{#if !child.id.includes('empty')}
				
					<!-- File -->
					<File id={child.id} {tabId} {listIds} nestDepth={nestDepth} />
					
					<!-- Folder -->
					{#if isExpandedFolder(child.id)}
						<svelte:self
						subtree={child}
						{listIds}
						isRoot={false}
						nestDepth={nestDepth+1}
						/>
					{/if}
				{/if}
			</li>
		{/each}
	</ul>
</div>
