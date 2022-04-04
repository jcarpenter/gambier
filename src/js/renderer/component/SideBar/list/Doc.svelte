<script>
	import { project, sidebar } from '../../../StateManager'
  import { files } from '../../../FilesManager'
	import Token from '../../ui/Token.svelte'
  import { onMousedown, onMouseup } from './interactions'
  import { getContext } from 'svelte';

	// Optionally pass in file to use for doc. If undefined, we'll get doc from $files
	// Gives us flexibility. In most cases we'll want the version from files, but
	// in case of search results, we want to pass in modified version of file, with
	// highlighted excerpt, etc.
	export let file = undefined
	export let id = ''
	export let listIds = []
	export let showTags = false
	
	const tabId = getContext('tabId')
	$: tab = $sidebar.tabsById[tabId]
	$: doc = file ? file : $files.byId[id]
	$: isSelected = tab.selected.some((id) => id == doc.id)
	$: isSidebarFocused = $project.focusedSectionId == 'sidebar'

</script>

<style type="text/scss">
	.doc {
		contain: strict;
		user-select: none;
		border-radius: 0;
		margin: 0;
		padding: 7px 0.75em;
		width: 100%;
		height: 80px;
		border-bottom: 1px solid var(--separator-color);
	}
	
	.title {
		@include system-regular-font;
		font-weight: bold;
		color: var(--label-color);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		line-height: 16px;
	}

	.tags {
		margin-bottom: 3px;
		white-space: nowrap;
		overflow: hidden;
	}

	.excerpt {
		@include system-regular-font;
		color: var(--label-2-color);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		// line-height: 13px;
		overflow: hidden;
		pointer-events: none;
		word-break: break-word;
		line-break: auto;
		line-height: 16px;
		li {
			@include list-reset;
			color: red;
		}
	}

	.excerpt :global(.highlight) {
		text-decoration: underline;
	}

	.showTags .excerpt {
		-webkit-line-clamp: 2;
	}

	.isSelected {
		border-radius: 4px;
		border-bottom: 0;
		height: 79px; // height minus 1, to create 1px gap below
		margin-bottom: 1px;
		.title, .excerpt {
			color: var(--menuitem-selected-text-color);
		}
		&.isSidebarFocused {
		  background-color: var(--selected-list-item-color);
		}
	
		// Selected, and parent list NOT focused
		&:not(.isSidebarFocused) {
		  background-color: var(--control-disabled-text-color);
		}
	}
</style>

<svelte:options immutable={true} />

<div
	class="doc"
	class:showTags
	class:isSelected
	class:isSidebarFocused
	on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds, $files)}
	on:mouseup={(evt) => onMouseup(evt, id, tab, tabId, $project.panels[$project.focusedPanelIndex], $files)}
	>
		<div class="title">{doc.title ? doc.title : doc.name}</div>
			{#if showTags}
				<div class="tags">
					{#each doc.tags as tag}
						<Token label={tag} />
					{/each}
				</div>
			{/if}
		<div class="excerpt">{@html doc.excerpt}</div>
</div>