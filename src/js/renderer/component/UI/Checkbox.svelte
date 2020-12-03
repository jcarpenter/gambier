<script>
  export let isChecked = false
  export let isCompact = false
  export let label = ''
</script>

<style type="text/scss">

  .isCompact {
    .label {
      @include label-normal-small;
      margin-bottom: -1px;
    }
    .box {
      width: 12px;
      height: 12px;
      border-radius: 2.5px;
      .img {
        -webkit-mask-size: 8px;
      }
    }
  }

  .isChecked {
    .box {
      background: 
        linear-gradient(rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0)),
        linear-gradient(var(--controlAccentColor), var(--controlAccentColor));
      box-shadow: none;

      .img {
        @include centered_mask_image;
        width: 100%;
        height: 100%;
        -webkit-mask-size: 10px;
        -webkit-mask-image: var(--img-checkmark-heavy);
        background-color: white;
      }
    }
  }

  .checkbox {
    display: inline-flex;
    align-items: center;
    max-height: 14px;
    overflow: hidden;
    &:not(:first-of-type) {
      padding-left: 8px;
    }
  }

  .box {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    background: var(--controlColor);
    box-shadow: 
      0 0 0 1px rgba(0, 0, 0, 0.15) inset,
      0px 1.5px 1px 0.5px rgba(0, 0, 0, 0.07) inset;
  }

  .label {
    @include label-normal;
    display: flex;
    align-items: center;
    margin-left: 5px; 
    color: var(--labelColor);
    user-select: none;
  }
</style>

<div class="checkbox" class:isChecked class:isCompact on:click>
  <span class="box">
    <div class="img"></div>
  </span>
  <span class="label">
    {label}
  </span>
</div>