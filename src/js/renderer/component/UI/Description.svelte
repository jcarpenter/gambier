<script>
  import { setSize } from "./actions";
  export let compact = false
  export let margin = '0'
</script>

<style type="text/scss">

  p {
    @include label-normal-small;
    color: var(--secondaryLabelColor);
    flex-basis: 100%;
  }

  // p.compact {
  //   @include label-normal-small;
  // }

</style>

<p 
  class:compact
  use:setSize={{margin}}
>
  <slot></slot>
</p>
