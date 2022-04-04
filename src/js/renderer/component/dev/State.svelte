<script>
  import { stringify } from '../../../shared/utils'
  import { state } from '../../StateManager'

</script>

<style type="text/scss">

  section {
    padding: 0rem 1rem;
    overflow: scroll;
  }

  h1 {
    @include title1-emphasized-text;
    color: var(--label-color);
  }

  h2 {
    @include system-regular-font;
    color: var(--label-2-color);
  }

  .stateTable {
    border: 1px solid var(--label-3-color);
    border-radius: 4px;
    padding: 0.4em 0.4em;
    margin-bottom: 1em;

    h2 {
      color: var(--label-color);
      display: block;
      padding: 0;
      @include system-small-font;
      font-weight: bold;
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
      @include system-small-font;
      text-align: right;
    //   flex-basis: 6em;
      color: var(--label-color);
      padding-right: 1em;
    }

    .val {
      @include system-small-font;
      flex: 1 1 auto;
      color: var(--label-2-color);
    }
  }

</style>

<section>
  <h1>App State</h1>

  <div class="stateTable">
    <div class="property">
      <div class="key">state</div>
      <div class="val">{stringify($state)}</div>
    </div>
  </div>
  
</section>
