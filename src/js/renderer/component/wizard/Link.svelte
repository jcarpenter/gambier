<script>
  // import { createEventDispatcher } from 'svelte'

  import ReferenceLabelSelect from './ReferenceLabelSelect.svelte'
  import ImagePreview from './ImagePreview.svelte'

  export let cm = null
  export let target = null

  let headerText

  $: {
    if (target !== null) {
      if (target.type == 'link-inline') {
      } else if (target.type == 'link-reference') {
      }

      if (target.type.includes('link')) {
        headerText = 'Link'
      } else if (target.type.includes('image')) {
        headerText = 'Image'
      } else if (target.type.includes('footnote')) {
        headerText = 'Footnote'
      }
    }
  }

  /**
   * Strip "wrapping characters" from title entities (e.g. the preceding white space plus wrapping single-quotes, double-quotes, or parentheses), so we can display just the core title text in the wizard UI. So it's cleaner for users, and so users don't inadvertently delete those essential characters. See: CommonMark spec on link titles: https://spec.commonmark.org/0.28/#link-title NOTE: If the element.title.string is empty, don't do anything.
   * Input: " Forest"
   * Return: Forest
   */
  function stripTitleWrappers(title) {
    const titleStringIsEmpty = title == ''
    if (titleStringIsEmpty) {
      return '' // Keep it empty
    } else {
      const titleWithoutWrappers = title.match(/\s("|'|\()(.*?)\1/)[2]
      // console.log(title)
      // console.log(titleWithoutWrappers)
      return titleWithoutWrappers
    }
  }

  /**
   * Add "wrapping characters" to input title value strings before we insert them into the document. If these characters are not in place, the markdown parser will not recognize the string as a link. See `stripTitleWrappers` explaination. If the title string was previously empty, and now has a value, add a preceding space and wrapping double-quotes ` "..."`. Else, if we're updating an existing title, preserve the existing wrappers (single-quotes, double-quotes, and parentheses are all allowed, per the CommonMark spec: https://spec.commonmark.org/0.28/#link-title )
   * @param {*} value - The new value of the title field
   */
  function addTitleWrappers(oldTitle, newTitle) {
    if (newTitle) {
      const titleStringWasEmpty = oldTitle == ''
      if (titleStringWasEmpty) {
        return ` "${newTitle}"`
      } else {
        const wrapper = oldTitle.match(/(\s("|'|\()).*?\2/)
        const string = `${wrapper[1]}${newTitle}${wrapper[2]}`
        return string
      }
    } else {
      return ''
    }
  }

  /**
   * Write input value to cm.
   */
  function handleInput(value, line, start, end) {
    cm.replaceRange(
      value,
      { line: line, ch: start },
      { line: line, ch: end },
      '+input'
    )
  }

  function switchInlineReferenceType(newType) {
    // Strings depend on whether we're dealing with link, image or footnote

    if (newType == 'reference') {
      cm.replaceRange(
        `[${target.text.string}][]`,
        { line: target.line, ch: target.start },
        { line: target.line, ch: target.end }
      )
    } else if (newType == 'inline') {
      const text =
        target.type == 'link-reference-full'
          ? target.text.string
          : target.label.string
      const url = target.definition.url.string
      const title = target.definition.title.string
      cm.replaceRange(
        `[${text}](${url}${title})`,
        { line: target.line, ch: target.start },
        { line: target.line, ch: target.end }
      )
    }
  }

  function switchReferenceStyles(value, start, end) {
    console.log(value)
  }

  function jumpToLine(line, ch = 0) {
    cm.setCursor(line, ch)
    cm.focus()
  }
</script>

<style type="text/scss">
</style>

<!-- stopPropagation on mousedown, or CodeMirror takes focus back, closing Wizard. -->

<div id="contents" class:reference={target.type.includes('reference')}>
  {#if target.error == 'missing-definition'}

    Missing definition

  {:else if target.type.includes('link')}

    <label for="url" required>URL</label>
    <input
      type="text"
      name="url"
      id="url"
      disabled={target.type.includes('reference')}
      required
      value={target.url.string}
      on:input={(e) => handleInput(e.target.value, target.line, target.url.start, target.url.end)} />
    <label for="title">Title</label>
    <input
      type="text"
      name="title"
      id="title"
      
      value={stripTitleWrappers(target.title.string)}
      on:input={(e) => handleInput(addTitleWrappers(target.title.string, e.target.value), target.line, target.title.start, target.title.end)} />
  
  {:else if target.type.includes('image')}
  
    <label for="url" required>URL</label>
    <input
      type="text"
      name="url"
      id="url"
      required
      value={target.url.string}
      on:input={(e) => handleInput(e.target.value, target.line, target.url.start, target.url.end)} />
    <label for="text" required>Alt</label>
    <input
      type="text"
      name="text"
      id="text"
      value={target.text.string}
      on:input={(e) => handleInput(e.target.value, target.line, target.text.start, target.text.end)} />
    <label for="title">Title</label>
    <input
      type="text"
      name="title"
      id="title"
      value={stripTitleWrappers(target.title.string)}
      on:input={(e) => handleInput(addTitleWrappers(target.title.string, e.target.value), target.line, target.title.start, target.title.end)} />
    <ImagePreview url={target.url.string} />

  {:else if target.type.includes('footnote')}
    
    <textarea
      type="text"
      name="text"
      id="text"
      required
      value={target.content.string}
      on:input={(e) => handleInput(e.target.value, target.line, target.content.start, target.content.end)} />
      
  {/if}
</div>

{#if target.type.includes('reference') && target.error !== 'missing-definition'}
  <a id="jumpToDef" on:click={() => jumpToLine(target.definitionLine)}>
    Jump to definition
  </a>
{/if}

{#if target.type.includes('reference')}
  <div>
    <!-- ID -->
    <ReferenceLabelSelect {target} label={'Reference ID'} />
    <!-- Reference: select style -->
    <!-- 
  <div id="styleSelect">
    <select name="style" id="style">
      <option selected={target.type.includes('full')} value="full">
        Full
      </option>
      <option selected={target.type.includes('collapsed')} value="collapsed">
        Collapsed
      </option>
      <option selected={target.type.includes('shortcut')} value="shortcut">
        Shortcut
      </option>
    </select>
    </div> 
  -->
  </div>
{/if}

<header>
  <h1>{headerText}</h1>
  <select
    on:input={(e) => switchInlineReferenceType(e.target.value)}
    name="type"
    id="type">
    <option selected={target.type.includes('inline')} value="inline">
      Inline
    </option>
    <option selected={target.type.includes('reference')} value="reference">
      Reference
    </option>
  </select>
</header>
