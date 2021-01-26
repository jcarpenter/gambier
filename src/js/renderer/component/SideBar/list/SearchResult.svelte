<script>
	import { project, sidebar } from '../../../StateManager'
  import { files } from '../../../FilesManager'
  import { onMousedown, onMouseup } from './interactions'
  import { getContext } from 'svelte';

	export let id = ''
	export let hits = []
	export let listIds = []
	$: numHits = hits.length
	
	const tabId = getContext('tabId')
	$: tab = $sidebar.tabsById[tabId]
	$: doc = $files.byId[id]
	$: isSelected = tab.selected.some((id) => id == doc.id)
	$: isSidebarFocused = $project.focusedSectionId == 'sidebar'

</script>

<style type="text/scss">
	.result {
		// contain: strict;
		user-select: none;
		border-radius: 0;
		margin: 0;
		padding: 7px 0.75em;
		width: 100%;
		// height: 80px;
		border-bottom: 1px solid var(--separatorColor);
  }
  
  .header {
    display: flex;

    .title {
      flex-grow: 1;
      @include label-normal-bold;
      color: var(--labelColor);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      line-height: 16px;
    }
    
    .numHits {
      @include label-normal-small;
      color: var(--secondaryLabelColor);
      flex-shrink: 0;
    }
  }

	.hits {
		@include label-normal;
    @include list-reset;
		color: var(--secondaryLabelColor);
		pointer-events: none;

    li {
      @include list-reset;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    li::before {
      content: '•';
      margin-right: 5px;
    }
	}

	.hits :global(.highlight) {
		text-decoration: underline;
	}

	.isSelected {
		border-radius: 4px;
		border-bottom: 0;
		// height: 79px; // height minus 1, to create 1px gap below
		margin-bottom: 1px;
		.title, .numHits, .hits {
			color: var(--selectedMenuItemTextColor);
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
	class="result"
	class:isSelected
	class:isSidebarFocused
	on:mousedown={(evt) => onMousedown(evt, id, isSelected, tab, tabId, listIds, $files)}
	on:mouseup={(evt) => onMouseup(evt, id, tab, tabId, listIds, $project.panels[$project.focusedPanelIndex], $files)}
	>
		<div class="header">
      <span class="title">{doc.title ? doc.title : doc.name}</span>
      <!-- <span class="numHits">{numHits}</span> -->
    </div>
    <ul class="hits">
      {#each hits as hit}
        <li>{@html hit}</li>
      {/each}
    </ul>
</div>