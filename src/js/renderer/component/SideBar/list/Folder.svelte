<script>
	import File from './File.svelte'
	import { state, sidebar } from '../../../StateManager.js'
  import { files } from '../../../FilesManager'
	import { flip } from 'svelte/animate';
	import { quadIn, linear } from 'svelte/easing'
	import { setAsCustomPropOnNode } from '../../ui/actions'
	import { standardEase } from '../../ui/easing'
	import { slideYPosition, testSlide } from '../../ui/transition'
  import { getContext } from 'svelte';

	export let subtree	
	export let listIds
	export let isRoot = true
	export let nestDepth = 0

	let isDragTarget = false
	
	const tabId = getContext('tabId')
	// $: duration = $state.timing.treeListFolder
	$: duration = 1200
	
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

	$: folder = $files.byId[subtree.id]
	$: isExpanded = isRoot || folder.numChildren > 0 && $sidebar.tabsById.project.expanded.includes(folder.id)

	function isFolder(id) {
		return $files.byId[id].isFolder
	}

	/**
	 * Select folder `File` when we drag over it, or it's children.
	 * Unless folder isRoot, in which case there is no visible parent `File`,
	 * so we select nothing.
	 */
	function onDragOver() {
		isDragTarget = true
	}

	function onDragLeave() {
		isDragTarget = false
	}

	function onDrop(evt) {
		console.log(evt)
		isDragTarget = false
		const file = evt.dataTransfer.files[0]
    window.api.send('moveOrCopyIntoFolder', file.path, folder.path, evt.altKey)
	}
</script>

<style type="text/scss">

  .folder {
		// contain: strict;
		position: absolute;
		width: 100%;
		overflow: clip;
		height: calc(var(--folderHeight) * 1px);
		
		// Add delay for border-radius and box-shadow, to prevent flickering when dragging
		// files into Project. The drag events tend to toggle `isDragTarget` rapidly, and 
		// adding a delay to the removal of the styles helps hide that.
		// Height delay is unrelated (is for the transition between open/close).
		transition: 
			height calc(var(--duration) * 1ms) var(--folderEasing),
			border-radius 1ms 50ms,
			box-shadow 1ms 50ms; 
		
		&.isRoot {
			// We set `position: relative` on root folder, 
			// so `width: 100%` fits the parent div correctly.
			position: relative;
		}
	}

  .folder,
  ul,
	li {
    // contain: strict;
    // position: absolute;
    transform-origin: left top;
    will-change: transform;
	}

	// See note above re: transitions for isDragTarget styles.
	// Here we turn delay off, so the styles apply instantly when drag starts.
	.folder.isRoot.isDragTarget {
		box-shadow: inset 0 0 0 2px var(--focus-ring-color);
		border-radius: 4px;
		transition-delay: 0; 
	}
	
	ul,
	li {
		@include list-reset;
	}

	li {
		position: relative;
		display: block;

		&.isEmpty {
			height: 28px;
			pointer-events: none;
			visibility: hidden;
			margin-bottom: 1px;
		}
	}
</style>

<!-- <svelte:options immutable={false} /> -->

<!-- If it's NOT the root folder, render a File that can be interacted with. -->
{#if !isRoot}
	<File 
		id={folder.id} {listIds} nestDepth={nestDepth-1} {isDragTarget} 
		on:dragover={onDragOver} 
		on:dragleave={onDragLeave} 
		on:drop={onDrop}
	/>
{/if}

<!-- 
If the folder is expanded, show the contents.
When dragging over the folder, toggle `isDragTarget`. 
This in turn highlights the File (above). 
-->

<!-- animate:testSlide={{delay: 0, duration: duration }}  -->
<!-- animate:flip={{duration: duration, easing: quadIn }}  -->
<!-- animate:testSlide={{delay: 0, duration: duration, easing: linear }} -->

{#if isExpanded}
	<div 
		class="folder" 
		class:isRoot
		class:isDragTarget
		on:dragover|preventDefault={() => { if (isRoot) onDragOver() }} 
		on:dragleave|preventDefault={() => { if (isRoot) onDragLeave() }}
		on:drop|preventDefault={(evt) => { console.log("drop"); if (isRoot) onDrop(evt) }}
		use:setAsCustomPropOnNode={{folderHeight, folderEasing, duration}}
		>
		<ul class="rows" transition:slideYPosition|local={{ 
			delay: 0,
			duration: isRoot ? 0 : duration,
			easing: linear
		}}>
			{#each subtree.children as child (child.id)}
				<li 
					animate:flip={{duration: duration, easing: linear }}
					class:isEmpty={child.id.includes('empty')}
				>
					{#if !child.id.includes('empty')}

						{#if isFolder(child.id)}
							
							<!-- Folder -->
							<svelte:self
							subtree={child}
							{listIds}
							isRoot={false}
							nestDepth={nestDepth+1}
							/>

						{:else}

							<!-- File -->
							<File id={child.id} {listIds} nestDepth={nestDepth}  
							on:dragover={onDragOver} 
							on:dragleave={onDragLeave} 
							on:drop={onDrop}/>

						{/if}
					{/if}
				</li>
			{/each}
		</ul>
	</div>
{/if}
