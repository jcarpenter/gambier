<script>
  import { stringify } from '../../shared/utils'
  import { state, files } from '../StateManager'

</script>

<style type="text/scss">
  @import '../../../styles/_mixins.scss';

  #stateDisplay {
    padding: 0rem 1rem;
    background-color: var(--windowBackgroundColor);
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
    border: 1px solid gray;
    border-radius: 4px;
    padding: 0.4em 0.4em;
    margin-bottom: 2em;

    header {
      @include label-normal-small-bold;
      background: gray;
      padding: 0.2em 0.4em;
      border-radius: 2px;
      color: white;
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

  <div class="stateTable">
    <!-- <header>Stores</header> -->
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
