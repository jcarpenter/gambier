<script lang='js'>
  import { setSize } from "./actions";
  export let compact = false
  export let margin = '0'
</script>

<style lang="scss">

  p {
    @include system-small-font;
    color: var(--label-2-color);
    flex-basis: 100%;
  }

  // p.compact {
  //   @include system-small-font;
  // }

</style>

<p 
  class:compact
  use:setSize={{margin}}
>
  <slot></slot>
</p>
