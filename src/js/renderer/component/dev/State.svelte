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

<section>
  <h1>App State</h1>

  <div class="stateTable">
    <div class="property">
      <div class="key">state</div>
      <div class="val">{stringify($state)}</div>
    </div>
  </div>
  
</section>
