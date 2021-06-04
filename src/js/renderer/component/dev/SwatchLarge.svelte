<script>
  import { setAsCustomPropOnNode } from "../ui/actions";

	export let name = ''
  export let colors = {}
  export let overriddenVariables = []

  $: color = colors[name]
  $: isOverridden = overriddenVariables.includes(name)
</script>

<style type="text/scss">

  .isOverridden {
    @include system-small-font;
    color: salmon;
  }

  div {
    width: 10em;
    overflow: hidden;
    display: inline-block;
  
    .swatch {
      position: relative;
      width: 100%;
      height: 2em; 

      .color, .grid {
        position: absolute;
        top: 0;
        width: 100%;
        height: 100%;
      }
      .color { 
        background-color: var(--color);
        left: 0;
        z-index: 2; 
      }
      .grid { 
        @include bg-checkerboard;
        right: 0;
        width: 2em;
        max-width: 50%;
        z-index: 1; 
      }
    }

    .textSample {
      width: 100%;
      height: 2em;
      display: flex;
      @include system-regular-font;
      color: var(--color);
      align-items: center;
      justify-content: center;
      border: 1px solid var(--color);
      margin: -0.3em 0 0;
    }


    h1, p {
      margin: 0.3em 0;
    }

    h1 {
      @include system-small-font;
      color: var(--label-color);
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      // border-top: 1px solid var(--gridColor);
    }
      
    .comment {
      @include system-small-font;
      color: var(--secondary-label-color);
      overflow: hidden;
      white-space: normal;
    }
  }
	
</style>

<div use:setAsCustomPropOnNode={{color}}>
  <div class="swatch">
    <div class="color"></div>
    <div class="grid"></div>
  </div>
  <div class="textSample">{color}</div>

  <h1>{name}</h1>
  {#if isOverridden}<p class="isOverridden">Overridden</p>{/if}
  <p class="comment">
    <slot />
  </p>

</div>



<!-- {#if title}
  <h3>{title}</h3>
{/if}
<div class="table">
	{#each Object.entries(colors) as [name, value]}
		<div class="color">
		<span class="swatch"><span class="color"></span><span class="grid"></span></span>
		<span class="data">
			<div class="name">{name}</div>
			<div class="value">{value}</div>
		</span>
		</div>
	{/each}
</div>

 -->
