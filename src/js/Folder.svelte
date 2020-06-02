<script>
    import File from './File.svelte';

    export let expanded = true;
    export let hidden = false;

    // export let typeOf;
    export let name;
    // export let path;
    // export let created;
    // export let modified;
    export let children;

    function toggle() {
        expanded = !expanded;
    }
</script>

<style type="text/scss">
    .expanded {
        /* background-color: rgba(119, 196, 247, 0.2); */
    } 

    .test {
        font-weight: 700;
    }

    ul {
        padding: 0;
        margin: 0;
        list-style: none;
        /* border-left: 1px solid #eee; */
    }

    li {
        font-size: 0.8rem;
        padding: 0.5em 0;
        border-top: 1px solid rgba(0, 0, 0, 0.2);
        line-height: 1.4em;
    
        &:hover {
            cursor: default;
            // background-color: rgba(0, 0, 0, 0.2);
        }
    }
</style>

<!-- {#if !hidden }
<span class:expanded on:click={toggle}>{name}</span>
{/if} -->

{#if expanded}
	<ul>
        {#if !hidden }
            <li class:expanded class="test" on:click={toggle}>{name}</li>
        {/if}
		{#each children as file}
			<li>
                {#if file.typeOf === 'Directory'}
					<svelte:self title={file.title} children={file.children} expanded/>
				{:else}
					<File path={file.path} title={file.title}/>
				{/if}
			</li>
		{/each}
	</ul>
{/if}