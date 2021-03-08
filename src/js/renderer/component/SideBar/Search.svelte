<script>
  import { arrowUpDown } from './list/interactions';
  import { project, sidebar } from '../../StateManager'
  import { files } from '../../FilesManager'
  import { setContext } from 'svelte';
  import Checkbox from '../ui/Checkbox.svelte';
  import Expandable from '../ui/Expandable.svelte';
  import Header from './Header.svelte'
  import PopupButton from '../ui/PopupButton.svelte';
  import PushButton from '../ui/PushButton.svelte';
  import InputText from '../ui/InputText.svelte'
  import SearchResult from './list/SearchResult.svelte'
  import Separator from '../ui/Separator.svelte'
  import FormRow from '../ui/FormRow.svelte';

  let query = '' // Bound to search field
  let replaceWith = '' // Bound to replace field

  let tabId = 'search'
  setContext('tabId', tabId);
  $: tab = $sidebar.tabsById[tabId]

	$: isSidebarFocused = $project.focusedSectionId == 'sidebar'

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
      if (file.type == 'folder') {
        lookInOptions.push({ label: file.name, id: id, checked: options.lookIn == id })
      }
    })
  }


  // -------- RESULTS -------- //
  
  const whitespaceAtStartRegex = new RegExp(/^\W*/)

  let results = []
  let resultIds = []
  let numHits = 0 // Total # of hits across all result docs

  $: $files, query, options, getResults()

  async function getResults() {

    // If query is empty, set empty variables and return.
    if (!query) {
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
      query: query,
      path: options.lookIn == '*' ? $project.directory : $files.byId[options.lookIn].path,
      matchExactPhrase: options.matchExactPhrase
    }

    // Query DB. If no results, return.
    const dbResults = await window.api.invoke('queryDb', params)
    if (!dbResults) return

    // Save regexp to find all highlight instances in results from db. Case-insensitive.
    const highlightRegex = new RegExp(`(<span class="highlight">.*?)(${query})(.*?)(<\/span>)`, 'gi')

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
        if (!options.matchCase || (options.matchCase && match[2] == query)) {

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
    if (replaceWith) {
      const filePaths = results.map((r) => r.path)
      window.api.send('replaceAll', query, replaceWith, filePaths, options.matchCase, options.matchExactPhrase, isMetaKey)
    }
  }

</script>

<style type="text/scss">

  .numberOfResults {
    @include label-normal-small;
    color: var(--labelColor);
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
  
  <InputText icon={'img-magnifyingglass'} placeholder={'Name'} margin={'0 10px 0'} bind:value={query} compact={true} />
  
  <Separator margin={'8px 10px 0'} />

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
          bind:value={replaceWith} 
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
  
  
  <!------------- RESULTS ------------->
  {#if query}
    <div class="numberOfResults">Found {numHits} results in {results.length} documents</div>
    <Separator margin={'0 10px'} />  
  {/if}
  <div class="listOfResults">
    {#each results as result (result.id)}
      <SearchResult id={result.id} hits={result.hits} listIds={resultIds} />
    {/each}
  </div>
</div>

