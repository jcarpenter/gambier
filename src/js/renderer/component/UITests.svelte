<script>
  import SearchField from './UI/SearchField.svelte'
  import Separator from './UI/Separator.svelte'

  // const sysColors = [
  //   'blue',
  //   'brown',
  //   'gray',
  //   'green',
  //   'orange',
  //   'pink',
  //   'purple',
  //   'red',
  //   'yellow',
  // ]

  // const accentColors = [
  //   'control-background',
  //   'control',
  //   'control-text',
  //   'disabled-control-text',
  //   'find-highlight',
  //   'grid',
  //   'header-text',
  //   'highlight',
  //   'keyboard-focus-indicator',
  //   'label',
  //   'link',
  //   'placeholder-text',
  //   'quaternary-label',
  //   'scrubber-textured-background',
  //   'secondary-label',
  //   'selected-content-background',
  //   'selected-control',
  //   'selected-control-text',
  //   'selected-menu-item-text',
  //   'selected-text-background',
  //   'selected-text',
  //   'separator',
  //   'shadow',
  //   'tertiary-label',
  //   'text-background',
  //   'text',
  //   'under-page-background',
  //   'unemphasized-selected-content-background',
  //   'unemphasized-selected-text-background',
  //   'unemphasized-selected-text',
  //   'window-background',
  //   'window-frame-text'
  // ]
</script>

<style type="text/scss">
</style>

<div id="ui-test">
  <SearchField />
  <Separator />

  <!-- <h1>Dark Mode CSS Test</h1>
  <h2>System Colors</h2>
  <table class="color-table">
    {#each sysColors as color}
      <tr id={color}>
        <td class="label">--syscolor-{color}</td>
        <td class="swatch" style="background: var(--syscolor-{color})" />
      </tr>
    {/each}
  </table>

  <h2>Accent Colors</h2>
  <table class="color-table">
    {#each accentColors as color}
      <tr id={color}>
        <td class="label">--accentcolor-{color}</td>
        <td class="swatch" style="background: var(--accentcolor-{color})" />
      </tr>
    {/each}
  </table> -->

  <!-- <div style="background-color: Canvas">Canvas</div>
  <div style="background-color: CanvasText">CanvasText</div>
  <div style="background-color: LinkText">LinkText</div>
  <div style="background-color: VisitedText">VisitedText</div>
  <div style="background-color: ActiveText">ActiveText</div>
  <div style="background-color: ButtonFace">ButtonFace</div>
  <div style="background-color: ButtonText">ButtonText</div>
  <div style="background-color: Field">Field</div>
  <div style="background-color: FieldText">FieldText</div>
  <div style="background-color: Highlight">Highlight</div>
  <div style="background-color: HighlightText">HighlightText</div>
  <div style="background-color: GrayText">GrayText</div> -->
  <!-- <div id="system-color-canvas"></div> -->
</div>
