<script lang='js'>
  import { project, sidebar } from '../../StateManager'
  import { files } from '../../FilesManager'
  import produce from 'immer'
  import Header from './Header.svelte'
  import SortMenu from './SortMenu.svelte'
  import Token from '../ui/Token.svelte'
  import Separator from '../ui/Separator.svelte'
  import DocList from './list/DocList.svelte'
  import Doc from './list/Doc.svelte'
  import { setContext } from 'svelte'
  import moment from 'moment'
  
  let tabId = 'tags'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]

  // Define sort option
  $: sortOptions = [
    { label: 'By Title', group: 'sortBy', isChecked: tab.sortBy == 'By Title' },
    { label: 'By Modified', group: 'sortBy', isChecked: tab.sortBy == 'By Modified' },
    { label: 'separator' },
    { label: 'Ascending', group: 'sortOrder', isChecked: tab.sortOrder == 'Ascending' },
    { label: 'Descending', group: 'sortOrder', isChecked: tab.sortOrder == 'Descending' },
  ]

  // $: isSidebarFocused = $project.focusedSectionId == 'sidebar'

  let allTags = []
  $: selectedTags = tab.selectedTags
  
  $: $files.byId, getTags()

  /**
   * Build list of tags from files. 
   * Add each unique tag in each file to the list.
   */
  function getTags() {
    allTags = []
    
    for (const [id, file] of Object.entries($files.byId)) {
      file.tags?.forEach((tag) => {
        if (!allTags.includes(tag)) {
          allTags.push(tag)
        }
      })
    }

    // Sort alphabetically
    allTags.sort((a, b) => a.localeCompare(b))
  }

  // -------- DATA -------- //

  let data = []

  $: $files, selectedTags, tab.sortBy, tab.sortOrder, getData()

  function getData() {
    data = produce($files.allIds, (draft) => {
      
      // Get ids with file type 'doc'
      draft = draft.filter((id) => {
        const file = $files.byId[id]
        const isDoc = file.isDoc
        const hasTag = file.tags?.some((fileTag) => selectedTags.includes(fileTag))
        return isDoc && hasTag
      })
    
      
      // Sort
      draft = draft.sort((a, b) => {
        const itemA = $files.byId[a]
        const itemB = $files.byId[b]

        if (tab.sortBy == 'By Title') {
          if (tab.sortOrder == 'Ascending') {
            return itemA.name.localeCompare(itemB.name)
          } else {
            return itemB.name.localeCompare(itemA.name)
          }
        } else if (tab.sortBy == 'By Modified') {
          if (tab.sortOrder == 'Ascending') {
            return moment(itemA.modified).isBefore(itemB.modified)
          } else {
            return moment(itemB.modified).isBefore(itemA.modified)
          }
        }
      })
      return draft
    })
  }

  function select(evt) {

    const { tag, domEvent } = evt.detail
    let newSelected = []

    // If meta key is held, add or remove from existing selection
    // Else, select the clicked tag (if it's not already selected).
    if (domEvent.metaKey) {

      newSelected = [...selectedTags]
      
      // If tag is already selected, remove it. Else, add it.
      if (selectedTags.includes(tag)) {
        const indexToRemove = selectedTags.indexOf(tag)
        newSelected.splice(indexToRemove, 1)
      } else {
        newSelected.push(tag)
      }
    } else {
      newSelected = [tag]
    }

    if (newSelected == []) return

    window.api.send('dispatch', {
      type: 'SIDEBAR_SELECT_TAGS',
      tags: newSelected,
    })
  }

</script>

<style lang="scss">

  #tagsList {
    padding: 8px 10px;
  }

  .noTags {
    @include system-regular-font;
    color: var(--label-2-color);
  }

</style>

<div class="section">
  <Header title={tab.title} hoverToShowSlot={true}>
    <SortMenu items={sortOptions} />
  </Header>
  <Separator margin={'0 10px'} />
  <div id="tagsList">
    {#if allTags.length > 0}
      {#each allTags as tag}
        <Token label={tag} isSelected={tab.selectedTags.includes(tag)} on:select={select} />
      {/each}
    {:else}
      <span class="noTags">No tags found</span>
    {/if}
  </div>
  <Separator margin={'0 10px'} />
  <!-- <SearchField focused bind:query placeholder={'Name'} /> -->
  <DocList listIds={data} component={Doc} showTags={selectedTags.length > 1} />
</div>

