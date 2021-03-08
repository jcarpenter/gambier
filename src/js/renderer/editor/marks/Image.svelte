<script>
  export let cm
  export let line = 0
  export let start = 0
  export let end = 0
  export let element = {}
  export let classes = []
  export let highlighted = false

  let el

  // cm.on('beforeSelectionChange', selectionChange)

  // function selectionChange() {
  //   console.log('selection changed')
  // }

  export function highlight() {
    highlighted = true
  }
  
  export function deHighlight() {
    highlighted = false
  }

  function onClick(evt) {
    cm.setSelection({line, ch: start}, {line, ch: end})
    el.focus()
  }

  function onDoubleClick(evt) {
    console.log('Open wizard')
  }
  
  function onFocus(evt) {
    highlighted = true
  }

  function onFocusout(evt) {
    highlighted = false
  }

  function onKeyDown(evt) {
    switch (evt.key) {
      case 'Backspace':
      case 'Delete':
        cm.replaceRange('', { line, ch: start }, { line, ch: end })
        cm.focus()
        break
      case 'ArrowLeft':
        cm.setCursor(line, start)
        cm.focus()
        break
      case 'ArrowRight':
        cm.setCursor(line, end)
        cm.focus()
        break
      case 'Tab':
        evt.preventDefault()
        if (evt.altKey) {
          // Forward alt-tab events to `cm` by using undocumented `cm.triggerOnKeyDown` function. Per https://discuss.codemirror.net/t/signal-keydown/548/2. This ensures that alt-tab events work consistently, from user-pov, regardless of what element is focused (cm or widget).
          cm.triggerOnKeyDown({ type: 'keydown', keyCode: 9, altKey: true, shiftKey: evt.shiftKey })
        }
        break
    }
  }

</script>

<style type="text/scss">
  span:hover {
    cursor: initial;
  }
</style>


<svelte:options accessors={true}/>

<span
  tabindex="0"
  bind:this={el}
  class={classes.join(' ')}
  class:highlighted
  on:mousedown|preventDefault={onClick}
  on:dblclick={onDoubleClick}
  on:focus={onFocus}
  on:focusout={onFocusout}
  on:keydown={onKeyDown}
/>