<script>
  export let color = 'primary'
  export let typography = 'label-normal'
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';

  div {
    flex-grow: 1;
    // border: 1px solid red;
  }

  // Color
  .primary {
    color: var(--labelColor);
  }

  .secondary {
    color: var(--secondaryLabelColor);
  }

  .tertiary {
    color: var(--tertiaryLabelColor);
  }

  .quaternary {
    color: var(--quaternaryLabelColor);
  }

  // Typography
  .label-normal {
    @include label-normal;
  }

  .label-normal-small {
    @include label-normal-small;
  }

  .label-normal-small-bold {
    @include label-normal-small-bold;
  }

  .label-large-bold {
    @include label-large-bold;
  }

  .column {
    @include column;
  }
</style>

<div class="label {color} {typography}"><slot></slot></div>
