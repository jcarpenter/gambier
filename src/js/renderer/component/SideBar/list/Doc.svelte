<script>
	import { createEventDispatcher, afterUpdate } from 'svelte'
	import { state, project, files, sidebar } from '../../../StateManager'
  import { onMousedown } from './interactions'
  import { getContext } from 'svelte';

	export let id
	export let listIds
	
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
		border-radius: 4px;
		margin: 0;
		padding: 7px 0.75em;
		width: 100%;
		height: 68px;

		// border-left: 4px solid var(--tertiaryLabelColor);
		line-height: 16px;
		border-bottom: 1px solid var(--separatorColor);
	}
	
	.title {
		@include label-normal-small-bold;
		color: var(--labelColor);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
	}

	.excerpt {
		@include label-normal-small;
		color: var(--secondaryLabelColor);
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 3;
		line-height: 13px;
		overflow: hidden;
		pointer-events: none;
		word-break: break-word;
		line-break: auto;
	}

	.isSelected {
		border-bottom: 0;
		height: 67px;
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
	class:isSelected
	class:isSidebarFocused
	on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds)}
	>
		<div class="title">{doc.title ? doc.title : doc.name}</div>
		<div class="excerpt">{doc.excerpt}</div>
</div>