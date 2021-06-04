<script>
  import IconButton from "../ui/IconButton.svelte";   
  import { Pos } from "codemirror"  

  export let cm // CM instance
  export let mark = undefined // CM bookmark mark

  // Demo: https://regex101.com/r/jvAgtM/1/
  const fencedCodeBlockStartRE = /(~~~+|```+)[ \t]*/
  // Demo: https://regex101.com/r/HpUBev/1
  const fencedCodeBlockModeStringRE = /^(?:~~~+|```+)[ \t]*(.*?)$/
  
  // A re-usable component for selecting the syntax of a fenced code block

  let items = [
    { label: 'C', lang: 'c', id: '0', checked: false },
    { label: 'C++', lang: 'c++', id: '1', checked: false },
    { label: 'C#', lang: 'csharp', id: '2', checked: false },
    { label: 'CSS', lang: 'css', id: '3', checked: false },
    { label: 'Elm', lang: 'elm', id: '4', checked: false },
    { label: 'HTML', lang: 'html', id: '5', checked: false },
    { label: 'JavaScript', lang: 'js', id: '6', checked: false },
    { label: 'JSON', lang: 'json', id: '7', checked: false },
    { label: 'Latex', lang: 'latex', id: '8', checked: false },
    { label: 'Lua', lang: 'lua', id: '9', checked: false },
    { label: 'Markdown', lang: 'markdown', id: '10', checked: false },
    { label: 'PHP', lang: 'php', id: '11', checked: false },
    { label: 'Python', lang: 'python', id: '12', checked: false },
    { label: 'Ruby', lang: 'ruby', id: '13', checked: false },
    { label: 'Rust', lang: 'rust', id: '14', checked: false },
    { label: 'SQL', lang: 'sql', id: '15', checked: false },
    { label: 'sTeX', lang: 'stex', id: '16', checked: false },
    { label: 'Swift', lang: 'swift', id: '17', checked: false },
    { label: 'XML', lang: 'xml', id: '18', checked: false },
    { label: 'YAML', lang: 'yaml', id: '19', checked: false },
  ]

  /**
   * When user clicks menu, update checked item just-in-time
   * by checking the current mode string.
   */
  function updateChecked() {
    const { line, ch } = mark.find()
    const lineText = cm.getLine(line)
    const currentMode = lineText.match(fencedCodeBlockModeStringRE)
    items.forEach((i) => i.checked = i.lang == currentMode[1])
  }
</script>

<style type="text/scss">
  .wrapper {
    position: absolute;
    right: 0;
  }
</style>

<svelte:options accessors={true} />

<div class="wrapper">

  <IconButton 
    icon='fencedcodeblock-syntax-icon' 
    showCaret={false} 
    compact={true}
    items={items} 
    iconScale={0.5}
    padding={'0'}
    tooltip='Select syntax' 
    on:mousedown={updateChecked}
    on:selectItem={(evt) => {
      const selected = evt.detail.item
      if (!selected) return
      const { line, endCh } = mark.find()
      const lineText = cm.getLine(line)
      const startCh = lineText.match(fencedCodeBlockStartRE)[0].length
  
      // console.log(Pos(line, startCh), Pos(line, lineText.length), selected.label.toLowerCase())
  
      cm.replaceRange(
        selected.label.toLowerCase(),
        Pos(line, startCh), 
        Pos(line, lineText.length)
      )
      // items.forEach((i) => {
      //   if (i.group == selected.group) {
      //     i.checked = i.label == selected.label
      //   }
      // })
    }}
  />
</div>
