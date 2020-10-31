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

  const characters = [
    {
      name: 'Jerry',
      children: [
        {
          name: 'Elaine',
        },
        {
          name: 'George',
        },
        {
          name: 'Kramer',
        },
      ],
    },
  ]

  let wrapper = null

  function toggletest() {
    wrapper.classList.toggle('open')
  }
</script>

<style type="text/scss">
  @import '../../../styles/_mixins.scss';

  #ui-test {
    width: 100%;
    height: 100%;
    padding: 20px;
  }

  #animationTest {
    @include label-normal;

    button {
      position: absolute;
      top: -1.4rem;
    }

    --itemHeight: 40px;
    --itemWidth: 24rem;

    position: relative;
    margin: 40px 0px;
    outline: 1px solid red;
    height: calc(4 * var(--itemHeight));
    width: var(--itemWidth);

    .itemWrapper.l1 > .item {
      background-color: rgba(59, 144, 214, 0.349);
    }
    
    .itemWrapper.l1:not(.open) > .item {
      background-color: rgba(59, 144, 214, 0.349);
    }

    .itemWrapper {
      --index: 0;
      position: absolute;
      top: calc(var(--index) * var(--itemHeight));
      left: 0;
      width: var(--itemWidth);
      height: calc(4 * var(--itemHeight));
      overflow: hidden;
      transition: height 0.2s;

      &:not(.open) {
        height: calc(1 * var(--itemHeight));
      }

      .item {
        user-select: none;
        position: absolute;
        top: 0;
        left: 0;
        height: var(--itemHeight);
        width: var(--itemWidth);
        background-color: rgba(0, 0, 0, 0.2);
        border-bottom: 1px solid rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 1rem;
      }
    }
  }
</style>

<div id="ui-test">
  <SearchField />
  <Separator />

  <div id="animationTest">
    <div bind:this={wrapper} class="itemWrapper l1 open" style="--index: 0">
      <div class="item" on:click={toggletest}>{characters[0].name}</div>
      {#each characters[0].children as person, index}
        <div class="itemWrapper l2" style={`--index: ${index + 1}`}>
          <div class="item">{person.name}</div>
        </div>
      {/each}
    </div>
    <div bind:this={wrapper} class="itemWrapper l3" style="--index: 0">
      <div class="item">Others</div>
    </div>
  </div>

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
