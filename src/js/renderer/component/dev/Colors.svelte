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
    const initialValues = await window.api.invoke('getColors')
    colors = initialValues.colors
    overriddenVariables = initialValues.overriddenVariables

    unusedColors = [
      'controlBackgroundColor', 
      'quaternaryLabelColor', 
      'alternateSelectedControlTextColor', 
      'findHighlightColor', 
      'gridColor', 
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
  //   selectedControlColor: colors.selectedControlColor,
  //   selectedTextBackgroundColor: colors.selectedTextBackgroundColor,
  // }
  

  // $: labelColors = {
  //   labelColor: colors.labelColor,
  //   secondaryLabelColor: colors.secondaryLabelColor,
  //   tertiaryLabelColor: colors.tertiaryLabelColor,
  //   quaternaryLabelColor: colors.quaternaryLabelColor,
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
  //   gridColor: colors.gridColor,
  //   headerTextColor: colors.headerTextColor
  // }

  // $: controlColors = {
  //   controlAccentColor: colors.controlAccentColor,
  //   controlColor: colors.controlColor,
  //   controlBackgroundColor: colors.controlBackgroundColor,
  //   controlTextColor: colors.controlTextColor,
  //   disabledControlTextColor: colors.disabledControlTextColor,
  //   selectedControlColor: colors.selectedControlColor,
  //   selectedControlTextColor: colors.selectedControlTextColor,
  //   alternateSelectedControlTextColor: colors.alternateSelectedControlTextColor,
  // }

  // $: windowColors = {
  //   windowBackgroundColor: colors.windowBackgroundColor,
  //   windowFrameTextColor: colors.windowFrameTextColor,
  // }

  // $: highlightColors = {
  //   findHighlightColor: colors.findHighlightColor,
  //   highlightColor: colors.highlightColor,
  //   shadowColor: colors.shadowColor,
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
    @include label-large-bold;
    color: var(--labelColor);
  }

  h2 {
    @include label-normal-bold;
    color: var(--labelColor);
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
    @include label-normal;
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
        Used in button accents (via the `$btn-accent-bg` mixin). Darker variation of `controlAccentColor`, created by getColors().
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
      <SwatchLarge name={'controlColor'} {colors} {overriddenVariables}> 
        Bright in both dark and light modes. Slightly dimmer in dark.
      </SwatchLarge>
      <SwatchLarge name={'controlTextColor'} {colors} {overriddenVariables}> 
        Background color for some UI elements / icons.
      </SwatchLarge>
      <SwatchLarge name={'disabledControlTextColor'} {colors} {overriddenVariables}> 
        Unfocused list element backgrounds (Media and Doc).
      </SwatchLarge>
    </div>
  </div>


  <div>
    <h2>Windows</h2>
    <div class="swatches">
      <SwatchLarge name={'separatorColor'} {colors} {overriddenVariables}> 
        Lines between sections in layouts.
      </SwatchLarge>
      <SwatchLarge name={'windowBackgroundColor'} {colors} {overriddenVariables}> 
        Window backgrounds.
      </SwatchLarge>
      <SwatchLarge name={'shadowColor'} {colors} {overriddenVariables}> 
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