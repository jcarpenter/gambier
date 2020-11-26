<script>
	export let title = ''
	export let colors = {}
</script>

<style type="text/scss">
  @import '../../../../styles/_mixins.scss';
  
	h3 {
		@include label-normal-small;
		margin: 1em 0;
		color: var(--labelColor);
		display: block;
		padding: 0;
		border-top: 1px solid var(--gridColor);
		padding-top: 0.4em;
	}
	  
	.table {
	  display: grid;
	  grid-template-columns: repeat(3, calc(25% - 0.4em)) 25%;
	  grid-gap: 0.4em;


	  .color {
		display: flex;
		gap: 0.5em;
		
		.data {
		  @include label-normal-small;
		  flex-grow: 1;
		  overflow: scroll;
		  
		  .name {
			color: var(--labelColor);
		  }

		  .value {
			color: var(--secondaryLabelColor);
		  }
		}
		.swatch {
		  flex-basis: 2em;
		  flex-shrink: 0;
		  position: relative;

		  .color, .grid {
			width: 100%;
			height: 100%;
			position: absolute;
			top: 0;
			left: 0;
		  }

		  .color {
			z-index: 2;
		  }

		  .grid {
				@include bg-checkerboard;
				z-index: 1;
				}
			}
		}
	}

	
</style>

{#if title}
	<h3>{title}</h3>
{/if}
<div class="table">
	{#each Object.entries(colors) as [name, value]}
		<div class="color">
		<span class="swatch"><span class="color" style={`background-color: ${value}`}></span><span class="grid"></span></span>
		<span class="data">
			<div class="name">{name}</div>
			<div class="value">{value}</div>
		</span>
		</div>
	{/each}
</div>