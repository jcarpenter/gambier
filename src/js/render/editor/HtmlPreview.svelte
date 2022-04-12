<script lang='js'>
  import debounce from "debounce"
  import { onMount } from "svelte"
  import { isValidHttpUrl } from "../../shared/utils"
  import { getLastLineOfHtmlBlock, getLocalPathWithFileScheme, getModeAndState } from "./editor-utils"
  import ResizeObserver from "svelte-resize-observer";
  import DisclosureButton from "../component/ui/DisclosureButton.svelte";
  import { Pos } from "codemirror";

  export let cm
  export let from
  export let domEl
  export let lineWidget = undefined

  let isOpen = true
  let htmlString = ''
  let to = {}
  
  const parser = new DOMParser()

  /**
   * Starting at the `from` value, find the last successive line 
   * with the `xml` mode name. That's our `to` line. The text in
   * the from and to ranges is our htmlString.
   * When we set the htmlString value, it triggers a re-render
   * of the dom contents.
   */
  function getHtmlString() {

    // console.log('htmlPreview: getHtmlString')
    
    // Find the last line of the html block by
    to.line = getLastLineOfHtmlBlock(cm, from.line)

    // Find last html character on the `to` line.
    // We can't assume it's simply the last character,
    // because plain text can follow html text. 
    // E.g. "</div> blah."
    // Blah is not html text, and shouldn't be included
    // in our preview.
    // We look for the last 
    const lastLineTokens = cm.getLineTokens(to.line)
    const lastToken = lastLineTokens.find((t) => t.type.includes('htmlBlock-closing-bracket'))
    to.ch = lastToken.end

    // Get new value of range between from and to
    const newString = cm.getRange(from, to)
    
    // Return, if there are no changes
    if (htmlString == newString) return

    // Clean up the markup, if necessary
    const doc = parser.parseFromString(newString, 'text/html')
    const childNodes = doc.body.childNodes
    for (var i = 0; i < childNodes.length; i++) {
      const child = childNodes[i]
      if (child.nodeName == 'VIDEO') {
        let src = child.getAttribute('src')
        if (src) {

          // Determine if it's local or remote
          const isRemote = isValidHttpUrl(src)

          // If it's remote, use without modification
          // If it's local, get working local path with `files` scheme
          if (isRemote) {
            // Do nothing
          } else {
            child.setAttribute('src', getLocalPathWithFileScheme(cm, src))
          }
        }
      }
    }

    // Update htmlString
    htmlString = doc.body.outerHTML
  }

  /**
   * Update the html string. Called from outside the component
   * when changes are detected to the associated html block.
   * We add a debounce so we're not doing expensive work on
   * every key press.
   */
  export const update = debounce(() => {
    getHtmlString()
  }, 500)

  /**
   * On component mount, get the initial htmlString value.
  */
  onMount(() => {
    getHtmlString()
  })

</script>

<style lang="scss">

  .htmlPreview { 
    // background-color: red;
    background-color: var(--fencedcodeblock-bg);
    padding: 0 0.5em 0.5em 0.5em;
    border-radius: 0.2em;
    overflow: hidden;
  }

  .collapse {
    // Push button off left side of preview element
    position: absolute;
    left: 2em;
    top: 0;
    width: 2em;
    
    // Display flex to position the disclosure button
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;

    // Will be revealed on hover of htmlPreview
    opacity: 0;
    height: 100%;
    transition: opacity 250ms ease;
  }

  .htmlPreview:hover .collapse {
    opacity: 1;
  }

  .htmlPreview:not(.isOpen) {
    height: 2em;
  }

  .htmlPreview.isOpen {

  }
  
  // Ensures that the <video> element will fit the width
  // of the container element, and height will match the
  // aspect ration of the video file.
  .htmlPreview > :global(video) {
    width: 100% !important;
    height: auto !important;
    border-radius: 0.2em;
    display: block;
  }

  .htmlPreview > :global(iframe) {
    width: 100% !important;
    height: auto !important;
    aspect-ratio: 1/0.6;
    border-radius: 0.2em;
    border: none;
    display: block;
  }  
</style>

<svelte:options accessors />

<div class="htmlPreview" bind:this={domEl} class:isOpen>
  <div class="collapse">

    <DisclosureButton
      width='22px'
      height='22px'
      padding='7px'
      top={0}
      left={0}
      opacity={0.6}
      rotation={isOpen ? 0 : -90}
      on:toggle={() => isOpen = !isOpen}
    />
      
    <!-- <IconButton tooltip='Tooltip' compact={true} /> -->
  </div>
  {#if isOpen}
    {@html htmlString}
  {:else}

  {/if}
  <!-- 
    We use svelte-resize-observer to catch size changes to div,
    and call `changed()` on the associated line widget.
   -->
  <ResizeObserver elementResize={domEl} on:resize={(e) => lineWidget?.changed() } />
</div>