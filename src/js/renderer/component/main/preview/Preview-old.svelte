<script lang='js'>
  export let cm = null
  export let target = null // An inlineElement
  export let editorState = {}

  // Per: https://developer.mozilla.org/en-US/docs/Web/API/URL
  let parsedLinkUrl = {
    // origin: '', // `https://joshcarpenter.ca/img/`
    // restOfHref: '', // `ice-sheet.jpg`
  }

  // Per: https://nodejs.org/api/path.html#path_path_parse_path
  let parsedImageUrl = {
    // dir: '', // `/home/user/dir`
    // base: '', // `file.txt`
  }

  let isVisible = false
  let isError = false
  let leftPos = '-5000px' // Default value
  let topPos = '0px'

  // Setup event listeners once `cm` is populated.
  $: {
    if (cm !== null) {
      cm.on('stateChanged', onEditorStateChange)
      validateURL()
    }
  }

  async function validateURL() {

    const test1 = await window.api.invoke(
      'getValidatedPathOrURL',
      editorState.openDoc.path,
      '/Users/josh/Desktop/curme-south.png'
    )

    const test2 = await window.api.invoke(
      'getValidatedPathOrURL',
      editorState.openDoc.path,
      '../Images/josh.png'
    )

    // getValidatedPathOrURL
    // 1. Determine whether URL is local or remote
    // 2. Test URL validity

    // Determine if path is local or remote
    // console.log(editorState.openDoc.path)

    // const test1 = await window.api.invoke(
    //   'getResolvedPath',
    //   editorState.openDoc.path,
    //   '../Images/josh.png'
    // )

    // console.log(test)

    // Update parsedPath
    // if (target.type.includes('link') && target.url) {
    //   // parsedLinkUrl = new URL(target.url.string)
    //   parsedLinkUrl = new URL('https://joshcarpenter.ca/img/marine-ice-sheet-instability-diagram-lg.jpg')
    //   console.log(parsedLinkUrl)
    //   try {console.log(new URL('google.com'))} catch { console.log(err) }
    //   console.log(new URL('../Images/josh.png'))
    // } else if (target.type.includes('image') && target.url) {
    //   parsedImageUrl = await window.api.invoke(
    //     'getParsedPath',
    //     target.url.string
    //   )
    // }Î
  }

  // ------- EVENT HANDLERS ------ //

  async function onEditorStateChange(changes) {
    if (changes.includes('widget') && changes.includes('hovered')) {
      // Show/Hide wizard, based on `editorState.widget.target`
      if (
        editorState.widget.hovered !== null &&
        editorState.widget.hovered !== editorState.widget.selected
      ) {
        // Update target
        target = editorState.widget.hovered

        // TEMP
        // validateURL()

        // Show
        show()
      } else {
        hide()
      }
    } else if (changes.includes('widget') && changes.includes('selected')) {
      if (editorState.widget.hovered == editorState.widget.selected) {
        hide()
      }
    } else if (changes.includes('lastChanges')) {
      // Update wizard target to new version, if we detect that the latest changes affected the characters that the wizard is currently targeting.
      if (isVisible) {
        const change = editorState.lastChanges.find(
          (c) =>
            c.from.line == target.line &&
            c.to.line == target.line &&
            target.start <= c.from.ch &&
            target.end >= c.to.ch
        )
        const targetWasAffected = change !== undefined
        if (targetWasAffected) {
          target = editorState.inlineElements.find(
            (e) => e.line == target.line && e.start == target.start
          )
        }
      }
    } else if (changes.includes('sourceMode') && editorState.sourceMode) {
      hide()
    }
  }

  // $: console.log(target)

  // ------- ACTIONS ------ //

  /**
   * Show wizard by toggling 'visible' class, and setting `top` and `left` positions.
   */
  export async function show() {
    if (target == null) return

    // Position
    const paddingOnLeftSideOfEditor = cm.display.lineSpace.offsetLeft
    leftPos = `${
      cm.charCoords({ line: target.line, ch: target.start }, 'local').left +
      paddingOnLeftSideOfEditor
    }px`
    topPos = `${
      cm.charCoords({ line: target.line, ch: target.start }, 'local').bottom
    }px`

    // Error
    isError = target.error

    // Make visible
    isVisible = true
  }

  /**
   * Hide wizard by toggling `visible` class and setting position back to off-screen defaults.
   */
  function hide() {
    isVisible = false

    // Reset to default values
    leftPos = '-5000px'
    topPos = '0px'
  }
</script>

<svelte:options accessors={true} />

<div
  id="preview"
  style="left:{leftPos}; top:{topPos}"
  class="below"
  class:error={isError}
  class:show={isVisible}
  class:hide={!isVisible}
  tabindex="-1">
  {#if target !== null}
    <div>
      <!-- Errors -->
      {#if target.error == 'missing-definition'}
        Missing definition
      {:else if target.error == 'missing-url'}
        Missing URL
      {:else}
        <!-- Content -->
        {#if target.type.includes('link') && target.url}
          {target.url.string}
        {:else if target.type.includes('image') && target.url}
          <div id="url">{target.url.string}</div>
          <!-- <div id="url">
            <span id="dir">{parsedImageUrl.dir}/</span>
            <span id="base">{parsedImageUrl.base}</span>
          </div> -->
          <div id="image-preview"><img src={target.url.string} /></div>
          <!-- {target.url.string} -->
        {:else if (target.type.includes('link') || target.type.includes('image')) && !target.url}
          URL not entered
        {:else if target.type.includes('footnote-inline') && target.content.string}
          {target.content.string}
        {:else if target.type.includes('footnote-reference') && target.definition.string}
          {target.definition.string}
        {/if}

        <!-- Tip. Appear when metaKey is pressed. -->
        <div id="tip">
          {#if editorState.isMetaKeyDown && (target.type.includes('link') || target.type.includes('image')) && target.url}
            Click to open URL
          {:else if editorState.isMetaKeyDown && target.type.includes('footnote-reference')}
            Click to jump to definition
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
