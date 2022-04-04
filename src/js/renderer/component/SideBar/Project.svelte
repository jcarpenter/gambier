<script>
  import { project, sidebar } from '../../StateManager'
  import { files } from '../../FilesManager'
  import { createTreeHierarchy, createFlatHierarchy } from 'hierarchy-js'
  import produce from 'immer'
  import Header from './Header.svelte'
  import SortMenu from './SortMenu.svelte'
  import SearchField from '../ui/SearchField.svelte'
  import Separator from '../ui/Separator.svelte'
  import TreeList from './list/TreeList.svelte'
  import DocList from './list/DocList.svelte'
  import File from './list/File.svelte'
  import { setContext } from 'svelte';
  import moment from 'moment'
  
  let query = '' // Bound to search field
  
  let tabId = 'project'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]
  
  $: sortOptions = [
    { label: 'By Title', group: 'sortBy', checked: tab.sortBy == 'By Title' },
    { label: 'By Modified', group: 'sortBy', checked: tab.sortBy == 'By Modified', separatorAfter: true },
    { label: 'Ascending', group: 'sortOrder', checked: tab.sortOrder == 'Ascending' },
    { label: 'Descending', group: 'sortOrder', checked: tab.sortOrder == 'Descending' },
  ]

  /* ---- How file updating works ----
   - User makes changes to project directory (e.g. adds a file).
   - Watcher chokidar instance catches. (main)
   - Updates its `files`, then sends patches to render process.
   - StateManager receives patches (render)
   - Applies them to it's 1:1 copy of files (`filesAsObject`), to keep them in sync.
   - Updates its files store (`files`). Which is exported.
   - Svelte components import `files` store.
   - Creates immutabale copy using immer, in `makeStore`
   - Updates whenever `$files` store from StateManager updates.
   - Immutable child components see their dependencies have updated, but only update when their objects are replaced.
   */


  // -------- DATA -------- //

  let data = {
    tree: {},
    allIds: []
  }

  $: $files, tab.expanded, query, getData()

  /**
   * Create the data tree that we'll use to list of files and folders. Start with `files.tree[0]` and create an immutable clone that is sorted, pruned of non-visible items, and that has empty rows inserted (see `insertEmptyRows` documentation for why). Also create a flattened list of the ids.
  */
  function getData() {

    // Use immer to apply changes immutably (leaving $files untouched).
    // console.log($files)
    data = produce(
      $files,
      (draft) => {

        // If the project is just a single empty folder, return.
        // This handles first-run scenarios.
        const isSingleEmptyFolder = draft.allIds.length == 1
        if (isSingleEmptyFolder) return

        // If query is empty, render list as tree, and show all files.
        // Else, render list as DocList, and only show files that match query criteria.
        if (query == '') {
          
          // Delete `byId` array
          delete draft.byId

          // Make tree of files
          sortSubTree(draft.tree[0])
          mapVisibleDescendants(draft.tree[0], true)
          insertEmptyRows(draft.tree[0])
          
          // Make flat array of files
          draft.allIds = createFlatHierarchy(draft.tree[0].children)
          draft.allIds = draft.allIds.filter((file) => !file.id.includes('empty')).map((f) => f.id)

        } else {
          
          // Filter draft.allIds to files that match query
          // Then build tree of results
          const QUERY = query.toUpperCase()
          draft.allIds = draft.allIds.filter((id) => {
            const file = draft.byId[id]
            const NAME = file.name.toUpperCase()
            const TITLE = file.isDoc ? file.title.toUpperCase() : ''
            if (!file.isFolder && (NAME.includes(QUERY) || TITLE.includes(QUERY))) {
              return true
            } else {
              return false
            }
          })

          // Delete `byId` array and `tree`. For displaying search results, we only need the array of ids from `allIds`.
          delete draft.tree
          delete draft.byId
        }

        // While searching, set selection. First try to maintain the current selection. But if none of the search results are already selected, then select the first result.
        if (query) {

          let noResultsAreSelected = !tab.selected.some((selectedId) => {
            return draft.allIds.some((id) => id == selectedId)
          })
          
          if (noResultsAreSelected) {
            const firstResultId = draft.allIds[0]
            window.api.send('dispatch', {
              type: 'SIDEBAR_SET_SELECTED',
              tabId: 'project',
              lastSelected: firstResultId,
              selected: [firstResultId],
            })
          }

        }
      }
    )
  }

  /** 
   * For a given list of items, sort by the sort criteria 
   */
  function sort(items) {
    items.sort((a, b) => {

      const itemA = $files.byId[a.id]
      const itemB = $files.byId[b.id]

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
  }

  /**
   * Sort tree items by sorting criteria.
  */
  function sortSubTree(folder) {
    // Sort
    sort(folder.children)
    folder.children.forEach((c) => {
      const isFolder = $files.byId[c.id].isFolder
      if (isFolder && c.children.length) {
        // If folder is not expanded, remove children.
        // Else, recursively sort
        const isExpanded = tab.expanded.includes(c.id)
        if (!isExpanded) {
          c.children = []
        } else {
          sortSubTree(c)
        }
      }
    })
  }


  /**
   * Determine how many visible descendants each expanded folder has.
   * We use these values to determine how many "empty" row items to insert.
  */
  function mapVisibleDescendants(folder, isRoot = false) {
    
    folder.numVisibleDescendants = 0
    const isExpanded = tab.expanded.some((id) => id == folder.id)

    if (!isRoot && !isExpanded)  return { numVisibleDescendants: 0 }

    folder.children.forEach((c) => {
      folder.numVisibleDescendants++
      const file = $files.byId[c.id]
      if (file.isFolder) {
        const { numVisibleDescendants } = mapVisibleDescendants(c)
        folder.numVisibleDescendants += numVisibleDescendants
      }
    })

    return {
      numVisibleDescendants: folder.numVisibleDescendants,
    }
  }

  /**
   * For each visible descendant of an expanded folder, insert an empty sibling row. Empty rows are just empty, invsible divs, of the same height as normal rows. We use them to create spaces in the lists where child folders and their children render. We use this overall so we can take advantage of Svelte's FLIP animate directive, which automatically tweens elements in keyed {#each} loops their new positions when their order changes.
  */
  function insertEmptyRows(folder) {

    // For each expanded folder, insert empty sibling elements equal to the length of folder's visible descendants.

    for (var i = 0; i < folder.children.length; i++) {
      
      let c = folder.children[i]
      if (c.id.includes('empty')) continue
      const file = $files.byId[c.id]
      const isExpandedFolder = file.isFolder && tab.expanded.some((id) => id == c.id)

      if (isExpandedFolder) {

        let emptyItems = []
        for (var x = 0; x < c.numVisibleDescendants; x++) {
          emptyItems.push({id: `empty-${c.id}-${x}`})
        }

        folder.children.splice(i + 1, 0, ...emptyItems)
        insertEmptyRows(c)
      }
    }
  }

</script>

<style type="text/css">
</style>

<div class="section">
  <Header title={tab.title} hoverToShowSlot={true}>
    <SortMenu items={sortOptions} />
  </Header>
  <Separator margin={'0 12px'} />
  <SearchField icon='search-field-icon' focused bind:query placeholder={'Name'} margin={'8px 12px 0'} />
  {#if query == ''} 
    <TreeList subtree={data.tree[0]} listIds={data.allIds} />
  {:else}
    <DocList listIds={data.allIds} component={File} />
  {/if}
</div>
