<script>
	import { project, files, sidebar } from '../../../StateManager'
	import Token from '../../ui/Token.svelte'
  import { onMousedown } from './interactions'
  import { getContext } from 'svelte';

	export let id
	export let listIds
	export let showTags = false
	
	const tabId = getContext('tabId')
	$: tab = $sidebar.tabsById[tabId]
	$: doc = $files.byId[id]
	$: isSelected = tab.selected.some((id) => id == doc.id)
	$: isSidebarFocused = $project.focusedLayoutSection == 'sidebar'

</script>

<style type="text/scss">
  @import '../../../../../styles/_mixins.scss';
		
	.doc {
		contain: strict;
		user-select: none;
		border-radius: 0;
		margin: 0;
		padding: 7px 0.75em;
		width: 100%;
		height: 80px;
		border-bottom: 1px solid var(--separatorColor);
	}
	
	.title {
		@include label-normal-bold;
		color: var(--labelColor);
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
		@include label-normal;
		color: var(--secondaryLabelColor);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		// line-height: 13px;
		overflow: hidden;
		pointer-events: none;
		word-break: break-word;
		line-break: auto;
		line-height: 16px;
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
			color: var(--controlColor);
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

<div
	class="doc"
	class:showTags
	class:isSelected
	class:isSidebarFocused
	on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds)}
	>
		<div class="title">{doc.title ? doc.title : doc.name}</div>
			{#if showTags}
				<div class="tags">
					{#each doc.tags as tag}
						<Token label={tag} />
					{/each}
				</div>
			{/if}
		<div class="excerpt">{doc.excerpt}</div>
</div>