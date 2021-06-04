<script>
  import { prettySize } from '../../../../shared/utils'
	import { createEventDispatcher, afterUpdate } from 'svelte'
	import { state, project, sidebar } from '../../../StateManager'
  import { files } from '../../../FilesManager'
  import { onMousedown } from './interactions'
  import { getContext } from 'svelte';
  import Label from '../../ui/Label.svelte'
  import Thumbnail from '../../ui/Thumbnail.svelte'

	export let id
	export let listIds
	export let showTags = false // Not used
	
	const tabId = getContext('tabId')
	$: tab = $sidebar.tabsById[tabId]
	$: file = $files.byId[id]
	$: isSelected = tab.selected.some((id) => id == file.id)
	$: isSidebarFocused = $project.focusedSectionId == 'sidebar'

</script>

<style type="text/scss">
		
	.media {
		contain: strict;
		user-select: none;
		border-radius: 0;
		margin: 0;
		padding: 7px 0.75em;
		width: 100%;
		height: 68px;
    border-bottom: 1px solid var(--separator-color);
    display: flex;
  }
  
  .thumb {
    flex-grow: 0;
    flex-basis: 60px;
    flex-shrink: 0;
    overflow: hidden;
    margin-right: 10px;

    background: #D8D8D8;
    border: 2px solid #FFFFFF;
    box-shadow: 0 0 2px 0 rgba(0,0,0,0.13), inset 0 0 1px 2px rgba(0,0,0,0.06);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
    }
  }

  .details {
    flex-grow: 1;
  }
	
	.filename {
		@include system-regular-font;
		font-weight: bold;
		color: var(--label-color);
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		line-height: 16px;
	}

	.metadata {
		@include system-regular-font;
		color: var(--secondary-label-color);
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

	.isSelected {
		border-radius: 4px;
		border-bottom: 0;
		height: 67px; // height minus 1, to create 1px gap below
		margin-bottom: 1px;
		.filename, .metadata {
			color: var(--controlColor);
		}
		&.isSidebarFocused {
		  background-color: var(--selected-list-item-color);
		}
	
		// Selected, and parent list NOT focused
		&:not(.isSidebarFocused) {
		  background-color: var(--disabledControlTextColor);
		}
	}

	
</style>

<svelte:options immutable={true} />

<div
	class="media"
	class:isSelected
	class:isSidebarFocused
	on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds, $files)}
  >
    <div class="thumb">
      <img src={file.path} />
    </div>
    <div class="details">
      <div class="filename">{file.name}</div>
      <div class="metadata">
        {file.format.toUpperCase()} - {prettySize(file.sizeInBytes, ' ')}<br />
        {file.dimensions.width} x {file.dimensions.height}
      </div>
    </div>
</div>