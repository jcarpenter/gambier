<script lang='js'>
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

<style lang="scss">
	.result {
		// contain: strict;
		user-select: none;
		border-radius: 0;
		margin: 0;
		padding: 7px 0.75em;
		width: 100%;
		// height: 80px;
		border-bottom: 1px solid var(--separator-color);
  }
  
  .header {
    display: flex;

    .title {
      flex-grow: 1;
      @include system-regular-font;
			font-weight: bold;
      color: var(--label-color);
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      line-height: 16px;
    }
    
    .numHits {
      @include system-small-font;
      color: var(--label-2-color);
      flex-shrink: 0;
    }
  }

	.hits {
		@include system-regular-font;
    @include list-reset;
		color: var(--label-2-color);
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