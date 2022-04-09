<script lang='js'>
  import { arrowUpDown } from './list/interactions';
  import { project, sidebar } from '../../StateManager'
  import { files } from '../../FilesManager'
  import { onDestroy, onMount, setContext, tick } from 'svelte';
  import Checkbox from '../ui/Checkbox.svelte';
  import Expandable from '../ui/Expandable.svelte';
  import Header from './Header.svelte'
  import PopupButton from '../ui/PopupButton.svelte';
  import PushButton from '../ui/PushButton.svelte';
  import InputText from '../ui/InputText.svelte'
  import SearchResult from './list/SearchResult.svelte'
  import Separator from '../ui/Separator.svelte'
  import FormRow from '../ui/FormRow.svelte';
  import { debounce } from 'debounce'
  import Preview from '../main/preview/Preview.svelte';
import { wait } from '../../../shared/utils';

  let queryInput = '' // Bound to Search InputText
  let queryValue = '' // Bound to Search InputText value
  
  let replaceInput = '' // Bound to Replace InputText
  let replaceValue = '' // Bound to Replace InputText value

  let tabId = 'search'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]

	$: isSidebarFocused = $project.focusedSectionId == 'sidebar'


  // -------- ON MOUNT -------- //
  
  let removeListenerMethods = []

  onMount(() => {

    // Focus Search input when 'findInFiles' is received.
    const findInFiles = window.api.receive('findInFiles', queryInput.focus)

    // Focus Replace input when 'replaceInFiles' is received.
    const replaceInFiles = window.api.receive('replaceInFiles', async () => {
      
      // Open 'Replace' expandable, if it's not already open
      const isReplaceOpen = $sidebar.tabsById[tabId].replace.isOpen
      if (!isReplaceOpen) {
        window.api.send('dispatch', {
          type: 'SIDEBAR_TOGGLE_EXPANDABLE', 
          tabId: tabId, 
          expandable: 'replace'
        })
        // Pause execution to give Replace expandable time to open
        // (state update, transition animation, etc), then focus().
        // NOTE: Very hacky. Relies on magic timing numbers. :p
        await wait(200)
      }
      
      // Focus Replace input right away
      replaceInput.focus()
      
    })

    removeListenerMethods.push(findInFiles, replaceInFiles)

    // Restore the query value from state
    queryValue = $sidebar.tabsById[tabId].queryValue

    // Focus the right input
    switch ($sidebar.tabsById[tabId].inputToFocusOnOpen) {
      case 'search': queryInput.focus(); break
      case 'replace': replaceInput.focus(); break
    }
  })

  onDestroy(() => {
    // Remove `window.api.receive` listeners
    removeListenerMethods.forEach((remove) => remove())
  })


  // -------- QUERY -------- //
  
  $: queryValueInState = $sidebar.tabsById.search.queryValue
  $: queryValueInState, updateQueryValueFromState()

  /**
   * When query in state changes, update local query to match.
   * This will typically be called when user selects 'Find in Files'
   * while content is selected in an editor. The editor instance will
   * set the active project's `tabsById.search.queryValue` value
   * via reducer. And we'll then catch the change here.
   */
  function updateQueryValueFromState() {
    
    // Return if Svelte not ready yet
    if (!queryInput) return
    
    // Only update if they don't already match
    if (queryValueInState !== queryValue) {   
      queryValue = queryValueInState
    }
  }

  $: queryValue, saveQueryValueToState()

  /**
   * Save query values to store so we if we switch away from tab
   * momentarily, our query is still there when we switch back.
   * Debounce so we're not updating every key stroke.
   */
  const saveQueryValueToState = debounce(() => {
    const valueHasChanged = queryValue !== $sidebar.tabsById.search.queryValue
    if (valueHasChanged) {
      window.api.send('dispatch', {
        type: 'SAVE_SEARCH_QUERY_VALUE', 
        value: queryValue
      })
    }
  }, 500)
  

  // -------- OPTIONS -------- //

  $: options = tab.options

  /**
   * Update state when the user modifies the params in the 'Options' section.
   */
  function updateOptions(key, value) {
    let newOptions = {...options}
    newOptions[key] = value
    window.api.send('dispatch', {
      type: 'SIDEBAR_SET_SEARCH_OPTIONS',
      options: newOptions
    })
  }

  $: $files, tab, setLookInMenuOptions() 
    
  let lookInOptions = []

  /**
   * Add each folder in the project as an option in the 'Look In:' menu.
   * First option is "All Folders". Below that, we list the folders.
   */
  function setLookInMenuOptions() {

    // Starting options
    lookInOptions = [
      { label: 'All Folders', id: '*', checked: options.lookIn == '*', separatorAfter: true },
    ]
    
    // Add each folder
    $files.allIds.forEach((id) => {
      const file = $files.byId[id]
      if (file.isFolder) {
        lookInOptions.push({ label: file.name, id: id, checked: options.lookIn == id })
      }
    })
  }


  // -------- RESULTS -------- //
  
  const whitespaceAtStartRegex = new RegExp(/^\W*/)

  let results = []
  let resultIds = []
  let numHits = 0 // Total # of hits across all result docs

  $: $files, queryValue, options, getResults()

  async function getResults() {

    // If query is empty, set empty variables and return.
    if (!queryValue) {
      results = []
      resultIds = []
      numHits = 0
      return
    }

    // We use `temp` values to avoid flickering while the values are being tallied.
    // We assign these to the actual values at the very end.
    let tempResults = []
    let tempResultIds = []
    let tempNumHits = 0

    // We pass these params to DB
    const params = {
      query: queryValue,
      path: options.lookIn == '*' ? $project.directory : $files.byId[options.lookIn].path,
      matchExactPhrase: options.matchExactPhrase
    }

    // Query DB. If no results, return.
    const dbResults = await window.api.invoke('queryDb', params)
    if (!dbResults) return

    // Save regexp to find all highlight instances in results from db. Case-insensitive.
    const highlightRegex = new RegExp(`(<span class="highlight">.*?)(${queryValue})(.*?)(<\/span>)`, 'gi')

    // Get results from db, find matches we care about (e.g. check case, if matchCase is true)
    // and format to highlight query only, instead of whole token. We're having to work around
    // limitations of sqlite FTS5 here. Push `file` (with id, list of hits, etc) into `results`.
    dbResults.forEach((r) => {
      
      // Get file
      const file = { ...$files.byId[r.id] } 
      file.hits = []
      
      // Find each hit in the doc, format it, and add string to `hits`
      const matches = r.body.matchAll(highlightRegex)
      for (const match of matches) {
        
        // If matchCase is false, always add to hits
        // If matchCase is true, only add to hits if query is an exact match.
        if (!options.matchCase || (options.matchCase && match[2] == queryValue)) {

          // Tweak formatting so highlight only applies to query string——not entire token.
          // For query = 'mark'
          // Before: '<span class="highlight">Marked</span>'
          // After: '<span class="highlight">Mark</span>ed'
          const newVersion = `${match[1]}${match[2]}${match[4]}${match[3]}`
          const start = match.index
          const end = match[0].length
          const before = r.body.substr(start - 10, 10).replace(whitespaceAtStartRegex, '')
          const after = r.body.substr(start + end, 20)
          file.hits.push(`${before}${newVersion}${after}`)

          // Increment `tempNumHits`
          tempNumHits++
        }
      }
      
      // If the file contains hits, push it to results array, and add the id.
      if (file.hits.length) {
        tempResults.push(file)
        tempResultIds.push(file.id)
      }
    })
    
    // When above is done, tell svelte to update to the new values
    results = tempResults
    resultIds = tempResultIds
    numHits = tempNumHits
  }


  // -------- REPLACE -------- //

  /**
   * Triggered by pressing 'Replace All' button
   */
   function replaceAll(isMetaKey) {
    if (replaceValue) {
      const filePaths = results.map((r) => r.path)
      window.api.send('replaceAll', queryValue, replaceValue, filePaths, options.matchCase, options.matchExactPhrase, isMetaKey)
    }
  }

</script>

<style lang="scss">

  .numberOfResults {
    @include system-small-font;
    color: var(--label-color);
    min-height: 25px;
    white-space: nowrap;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .listOfResults {
    padding: 5px 10px 10px;
    flex-grow: 1;
    overflow-y: scroll;
    position: relative;
  }
</style>

<svelte:window on:keydown={(evt) => {
	if (!isSidebarFocused) return
  switch (evt.key) {
    case 'ArrowUp':
    case 'ArrowDown':
      evt.preventDefault()
      arrowUpDown(evt.key, evt.shiftKey, evt.altKey, tab, tabId, resultIds, $files, $project)
      break
  }
}} />


<div class="section">
  
  <Header title={tab.title} hoverToShowSlot={true}></Header>
  
  <Separator margin={'0 10px 8px'} />
  
  <InputText 
    placeholder={'Name'} 
    icon={'search-field-icon'} 
    margin={'0 10px 0'} 
    compact={true}
    bind:this={queryInput}
    bind:value={queryValue} 
  />
  
  <Separator margin={'8px 10px 0'} />


  <!------------- REPLACE ------------->

  <Expandable 
    title={'Replace:'} 
    maxExpandedHeight={55}
    margin={'0 8px'} 
    isOpen={tab.replace.isOpen} 
    on:toggle={() => 
      window.api.send('dispatch', {
        type: 'SIDEBAR_TOGGLE_EXPANDABLE', 
        tabId: tabId, 
        expandable: 'replace'
      })
    }
  >
    {#if tab.replace.isOpen}
      <FormRow margin={'4px 10px 8px'} outroDelay={200} compact={true}>
        <InputText 
          placeholder='Replace' 
          width='100%' 
          compact={true} 
          bind:this={replaceInput}
          bind:value={replaceValue} 
          on:input={(evt) => { 
            if (evt.key == 'Enter') {
              replaceAll(evt.metaKey)
            }
          }}
        />
        <PushButton 
          label="Replace All" 
          width='120px' 
          margin='0 0 0 5px' 
          compact={false}
          on:mousedown={(evt) => replaceAll(evt.metaKey)} 
        />
      </FormRow>
    {/if}
  </Expandable>

  <Separator margin={'0 10px'} />


  <!------------- OPTIONS ------------->

  <Expandable 
    title={'Options:'} 
    maxExpandedHeight={75}
    margin={'0 8px'} 
    isOpen={tab.options.isOpen} 
    on:toggle={() => 
      window.api.send('dispatch', {
        type: 'SIDEBAR_TOGGLE_EXPANDABLE', 
        tabId: tabId, 
        expandable: 'options'
    })
  }>

    {#if tab.options.isOpen}

      <!-- Match: -->
      <FormRow label={'Match:'} margin={'4px 10px 8px'} leftColumn={'50px'} outroDelay={200} compact={true} >
        <Checkbox 
          label='Case'
          checked={options.matchCase} 
          margin={'0 5px 0 0'} 
          compact={true} 
          on:click={(evt) => updateOptions('matchCase', !options.matchCase)} 
        />
        <Checkbox 
          label='Exact Phrase'
          checked={options.matchExactPhrase} 
          compact={true} 
          on:click={(evt) => updateOptions('matchExactPhrase', !options.matchExactPhrase)} 
        />
        <!-- <Token label={'Case'} /><Token label={'Exact Phrase'} /> -->
      </FormRow>

      <!-- Match: -->
      <FormRow label={'Look In:'} margin={'4px 10px 8px'} leftColumn={'50px'} outroDelay={200} compact={true}>
        <PopupButton compact=true items={lookInOptions} width='110px' on:selectItem={(evt) => updateOptions('lookIn', evt.detail.item.id)}/>
      </FormRow>

      <!-- Tags -->
      <!-- <div class="row">
        <div class="label">Tags:</div>
        <div>
        </div>
      </div> -->
    {/if}
    
  </Expandable>

  <Separator margin={'0 10px'} />

  
  <!------------- RESULTS ------------->
  {#if queryValue}
    <div class="numberOfResults">Found {numHits} results in {results.length} documents</div>
    <Separator margin={'0 10px'} />  
  {/if}
  <div class="listOfResults">
    {#each results as result (result.id)}
      <SearchResult id={result.id} hits={result.hits} listIds={resultIds} />
    {/each}
  </div>
</div>

