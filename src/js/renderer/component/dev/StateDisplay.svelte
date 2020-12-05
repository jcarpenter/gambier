<script>
  import { stringify } from '../../../shared/utils'
  import { state, files } from '../../StateManager'
  import SwatchTable from './SwatchTable.svelte'

  $: colors = $state.appearance.os.colors

  $: systemColors = {
    systemBlue: colors.systemBlue,
    systemBrown: colors.systemBrown,
    systemGray: colors.systemGray,
    systemGreen: colors.systemGreen,
    systemIndigo: colors.systemIndigo,
    systemOrange: colors.systemOrange,
    systemPink: colors.systemPink,
    systemPurple: colors.systemPurple,
    systemRed: colors.systemRed,
    systemTeal: colors.systemTeal,
    systemYellow: colors.systemYellow,
  }
  
  $: labelColors = {
    labelColor: colors.labelColor,
    secondaryLabelColor: colors.secondaryLabelColor,
    tertiaryLabelColor: colors.tertiaryLabelColor,
    quaternaryLabelColor: colors.quaternaryLabelColor,
  }

  $: textColors = {
    textColor: colors.textColor,
    placeholderTextColor: colors.placeholderTextColor,
    selectedTextColor: colors.selectedTextColor,
    textBackgroundColor: colors.textBackgroundColor,
    selectedTextBackgroundColor: colors.selectedTextBackgroundColor,
    keyboardFocusIndicatorColor: colors.keyboardFocusIndicatorColor,
    unemphasizedSelectedTextColor: colors.unemphasizedSelectedTextColor,
    unemphasizedSelectedTextBackgroundColor: colors.unemphasizedSelectedTextBackgroundColor,
  }

  $: contentColors = {
    linkColor: colors.linkColor,
    separatorColor: colors.separatorColor,
    selectedContentBackgroundColor: colors.selectedContentBackgroundColor,
    unemphasizedSelectedContentBackgroundColor: colors.unemphasizedSelectedContentBackgroundColor,
  }

  $: menuColors = {
    selectedMenuItemTextColor: colors.selectedMenuItemTextColor,
  }

  $: tableColors = {
    gridColor: colors.gridColor,
    headerTextColor: colors.headerTextColor
  }

  $: controlColors = {
    controlAccentColor: colors.controlAccentColor,
    controlColor: colors.controlColor,
    controlBackgroundColor: colors.controlBackgroundColor,
    controlTextColor: colors.controlTextColor,
    disabledControlTextColor: colors.disabledControlTextColor,
    selectedControlColor: colors.selectedControlColor,
    selectedControlTextColor: colors.selectedControlTextColor,
    alternateSelectedControlTextColor: colors.alternateSelectedControlTextColor,
  }

  $: windowColors = {
    windowBackgroundColor: colors.windowBackgroundColor,
    windowFrameTextColor: colors.windowFrameTextColor,
  }

  $: highlightColors = {
    findHighlightColor: colors.findHighlightColor,
    highlightColor: colors.highlightColor,
    shadowColor: colors.shadowColor,
  }



</script>

<style type="text/scss">

  #stateDisplay {
    padding: 0rem 1rem;
    overflow: scroll;
  }

  h1 {
    @include label-large-bold;
    color: var(--labelColor);
  }

  h2 {
    @include label-normal;
    color: var(--secondaryLabelColor);
  }

  .stateTable {
    border: 1px solid var(--tertiaryLabelColor);
    border-radius: 4px;
    padding: 0.4em 0.4em;
    margin-bottom: 1em;

    h2 {
      color: var(--labelColor);
      display: block;
      padding: 0;
      @include label-normal-small-bold;
      margin: 0 0 1em;
    }
  }

  .property {
    display: flex;
    direction: column;
    padding: 0.2em 0;
    // padding: 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);

    div {
      display: inline-block;
      // padding-bottom: 0.5em;
      white-space: pre-wrap;
    //   max-height: 30em;
      overflow: scroll;
    }

    .key {
      @include label-normal-small;
      text-align: right;
    //   flex-basis: 6em;
      color: var(--labelColor);
      padding-right: 1em;
    }

    .val {
      @include label-normal-small;
      flex: 1 1 auto;
      color: var(--secondaryLabelColor);
    }
  }

</style>

<div id="stateDisplay">
  <h1>State</h1>

  <div class="stateTable colors">
    <h2>System Colors</h2>
    <SwatchTable colors={systemColors} />    
  </div>
  
  <div class="stateTable colors">
    <h2>Dynamic System Colors</h2>
    <SwatchTable title={'Labels'} colors={labelColors} />    
    <SwatchTable title={'Text'} colors={textColors} />    
    <SwatchTable title={'Content'} colors={contentColors} />
    <SwatchTable title={'Menus'} colors={menuColors} />
    <SwatchTable title={'Tables'} colors={tableColors} />
    <SwatchTable title={'Controls'} colors={controlColors} />
    <SwatchTable title={'Windows'} colors={windowColors} />
    <SwatchTable title={'Highlights & Shadows'} colors={highlightColors} />
  </div>

  <div class="stateTable">
    <div class="property">
      <div class="key">state</div>
      <div class="val">{stringify($state)}</div>
    </div>
  </div>

  <div class="stateTable">
    <div class="property">
      <div class="key">files</div>
      <div class="val">{stringify($files)}</div>
    </div>
  </div>
  
</div>
