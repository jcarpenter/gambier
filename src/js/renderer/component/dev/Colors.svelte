<script>
import { onMount } from 'svelte';

  import { stringify } from '../../../shared/utils'
  import { state } from '../../StateManager'
  import SwatchTable from './SwatchTable.svelte'
  import SwatchLarge from './SwatchLarge.svelte'

  let colors = {}
  let overriddenVariables = []
  let unusedColors = []

  onMount(async () => {

    // Setup listener for updated colors
    window.api.receive('updatedSystemColors', (newColors, newOverriddenVariables) => {
      colors = newColors
      overriddenVariables = newOverriddenVariables
    })

    // Get initial colors
    const initialValues = await window.api.invoke('getSystemColors')
    colors = initialValues.colors
    overriddenVariables = initialValues.overriddenVariables

    unusedColors = [
      'controlBackgroundColor', 
      'label-4-color', 
      'alternateSelectedControlTextColor', 
      'findHighlightColor', 
      'grid-color', 
      'headerTextColor', 
      'highlightColor', 
      'linkColor', 
      'selectedControlTextColor', 
      'selectedTextColor', 
      'textBackgroundColor', 
      'unemphasizedSelectedContentBackgroundColor', 
      'unemphasizedSelectedTextBackgroundColor', 
      'unemphasizedSelectedTextColor', 
      'windowFrameTextColor', 
    ]

  })

  // $: systemColors = {
  //   systemBlue: colors.systemBlue,
  //   systemBrown: colors.systemBrown,
  //   systemGray: colors.systemGray,
  //   systemGreen: colors.systemGreen,
  //   systemIndigo: colors.systemIndigo,
  //   systemOrange: colors.systemOrange,
  //   systemPink: colors.systemPink,
  //   systemPurple: colors.systemPurple,
  //   systemRed: colors.systemRed,
  //   systemTeal: colors.systemTeal,
  //   systemYellow: colors.systemYellow,
  // }
  
  // $: accentInfluencedColors = {
  //   controlAccentColor: colors.controlAccentColor,
  //   darkerControlAccentColor: colors.darkerControlAccentColor,
  //   keyboardFocusIndicatorColor: colors.keyboardFocusIndicatorColor,
  //   selectedContentBackgroundColor: colors.selectedContentBackgroundColor,
  //   selectedcontrol-selected-text-color: colors.selectedcontrol-selected-text-color,
  //   selectedTextBackgroundColor: colors.selectedTextBackgroundColor,
  // }
  

  // $: labelColors = {
  //   labelColor: colors.labelColor,
  //   secondaryLabelColor: colors.secondaryLabelColor,
  //   tertiaryLabelColor: colors.tertiaryLabelColor,
  //   label-4-color: colors.label-4-color,
  // }

  // $: textColors = {
  //   textColor: colors.textColor,
  //   placeholderTextColor: colors.placeholderTextColor,
  //   selectedTextColor: colors.selectedTextColor,
  //   textBackgroundColor: colors.textBackgroundColor,
  //   selectedTextBackgroundColor: colors.selectedTextBackgroundColor,
  //   keyboardFocusIndicatorColor: colors.keyboardFocusIndicatorColor,
  //   unemphasizedSelectedTextColor: colors.unemphasizedSelectedTextColor,
  //   unemphasizedSelectedTextBackgroundColor: colors.unemphasizedSelectedTextBackgroundColor,
  // }

  // $: contentColors = {
  //   linkColor: colors.linkColor,
  //   separatorColor: colors.separatorColor,
  //   selectedContentBackgroundColor: colors.selectedContentBackgroundColor,
  //   unemphasizedSelectedContentBackgroundColor: colors.unemphasizedSelectedContentBackgroundColor,
  // }

  // $: menuColors = {
  //   selectedMenuItemTextColor: colors.selectedMenuItemTextColor,
  // }

  // $: tableColors = {
  //   grid-color: colors.grid-color,
  //   headerTextColor: colors.headerTextColor
  // }

  // $: control-selected-text-colors = {
  //   controlAccentColor: colors.controlAccentColor,
  //   control-selected-text-color: colors.control-selected-text-color,
  //   controlBackgroundColor: colors.controlBackgroundColor,
  //   controlTextColor: colors.controlTextColor,
  //   control-disabled-text-color: colors.control-disabled-text-color,
  //   selectedcontrol-selected-text-color: colors.selectedcontrol-selected-text-color,
  //   selectedControlTextColor: colors.selectedControlTextColor,
  //   alternateSelectedControlTextColor: colors.alternateSelectedControlTextColor,
  // }

  // $: windowColors = {
  //   window-background-color: colors.window-background-color,
  //   windowFrameTextColor: colors.windowFrameTextColor,
  // }

  // $: highlightColors = {
  //   findHighlightColor: colors.findHighlightColor,
  //   highlightColor: colors.highlightColor,
  //   shadow-color: colors.shadow-color,
  // }

  // function darken(startingColor) {
  //   const color = Color(startingColor).darken(0.2).hex()
  //   return color
  // }

  // function blacken(startingColor) {
  //   return chroma.blend(startingColor, '#C2C2C2', 'burn').desaturate(0.6);
  // }

</script>

<style type="text/scss">

  section {
    padding: 0rem 1rem;
  }

  h1 {
    @include title1-emphasized-text;
    color: var(--label-color);
  }

  h2 {
    @include system-regular-font;
    color: var(--label-color);
    font-weight: bold;
    margin: 0;
    width: 6em; 
    display: inline;
    float: left;
  }

  .swatches {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1em;
    margin: 0 0 1em;
  }

  .overriddenValues {
    @include system-regular-font;
  }

  hr {
    margin: 2em 0;
  }

</style>

<section>

  <hr>

  <h1>Colors</h1>

  <!-- <div class="overriddenValues">
    {#each overriddenVariables as variableName}
      {variableName}, 
    {/each}
  </div> -->

  <div>
    <h2>Accent</h2>
    <div class="swatches">
      <SwatchLarge name={'iconAccentColor'} {colors} {overriddenVariables}> 
        Icons backgrounds.
      </SwatchLarge>
      <SwatchLarge name={'controlAccentColor'} {colors} {overriddenVariables}> 
        Hovered menu items. Button accents (in it's `darker` variation).
      </SwatchLarge>
      <SwatchLarge name={'darkerControlAccentColor'} {colors} {overriddenVariables}> 
        Used in button accents (via the `$btn-accent-bg` mixin). Darker variation of `controlAccentColor`, created by getSystemColors().
      </SwatchLarge>
      <SwatchLarge name={'selectedContentBackgroundColor'} {colors} {overriddenVariables}> 
        Selected list item backgrounds.
      </SwatchLarge>
      <SwatchLarge name={'keyboardFocusIndicatorColor'} {colors} {overriddenVariables}> 
        Drag highlights. E.g. Drag doc into panel.
      </SwatchLarge>
    </div>
  </div>


  <div>
    <h2>Label</h2>
    <div class="swatches">
      <SwatchLarge name={'labelColor'} {colors} {overriddenVariables}>  
        Button text. Background in a few places. Most-used variable.
      </SwatchLarge>
      <SwatchLarge name={'secondaryLabelColor'} {colors} {overriddenVariables}> 
        Same as labelColor. Second-most used variable.
      </SwatchLarge>
      <SwatchLarge name={'tertiaryLabelColor'} {colors} {overriddenVariables}> 
        Used for unimportant info (e.g. counters on list items).
      </SwatchLarge>
    </div>
  </div>


  <div>
    <h2>Text</h2>
    <div class="swatches">
        <SwatchLarge name={'textColor'} {colors} {overriddenVariables}> 
        Input text (e.g. search field). And eventually also editor text.
      </SwatchLarge>
      <SwatchLarge name={'placeholderTextColor'} {colors} {overriddenVariables}> 
        Input placeholder text (e.g. search field).
      </SwatchLarge>
      <SwatchLarge name={'selectedMenuItemTextColor'} {colors} {overriddenVariables}> 
        Color of selected menu items. Although I'm not completely consistent about using it.
      </SwatchLarge>
    </div>
  </div>


  <div>
    <h2>Controls</h2>
    <div class="swatches">
        <SwatchLarge name={'buttonBackgroundColor'} {colors} {overriddenVariables}> 
        Button backgrounds. Hovered menu. Has `darker` mixin.
      </SwatchLarge>
      <SwatchLarge name={'control-selected-text-color'} {colors} {overriddenVariables}> 
        Bright in both dark and light modes. Slightly dimmer in dark.
      </SwatchLarge>
      <SwatchLarge name={'controlTextColor'} {colors} {overriddenVariables}> 
        Background color for some UI elements / icons.
      </SwatchLarge>
      <SwatchLarge name={'control-disabled-text-color'} {colors} {overriddenVariables}> 
        Unfocused list element backgrounds (Media and Doc).
      </SwatchLarge>
      <SwatchLarge name={'errorColor'} {colors} {overriddenVariables}> 
        Error states. E.g. Border on empty required input field.
      </SwatchLarge>
    </div>
  </div>


  <div>
    <h2>Windows</h2>
    <div class="swatches">
      <SwatchLarge name={'separatorColor'} {colors} {overriddenVariables}> 
        Lines between sections in layouts.
      </SwatchLarge>
      <SwatchLarge name={'window-background-color'} {colors} {overriddenVariables}> 
        Window backgrounds.
      </SwatchLarge>
      <SwatchLarge name={'shadow-color'} {colors} {overriddenVariables}> 
        Can be an alternative to separatorColor, for dark separations.
      </SwatchLarge>
    </div>
  </div>

  <!-- <h2>Custom (non-macOS)</h2>
  <div class="large-swatches">
    <SwatchLarge name={'foregroundColor'} {colors} {overriddenVariables}> 
      White if dark mode. Black if light mode.
    </SwatchLarge>
    <SwatchLarge name={'backgroundColor'} {colors} {overriddenVariables}> 
      Opposite of foregroundColor.
    </SwatchLarge>
  </div> -->

  <hr>

  <div>
    <h2>Unused</h2>
    <div class="swatches">
      {#each unusedColors as name }
        <SwatchLarge {name} {colors} {overriddenVariables} />
      {/each}
    </div>
  </div>

</section>