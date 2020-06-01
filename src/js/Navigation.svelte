<script>
    import * as config from '../config.js'
    import Folder from './Folder.svelte'
    import { onMount } from 'svelte'

    let root

    window.api.receive('stateChanged', (store) => {
        if (store.hierarchy && store.hierarchy[0] !== root) {
            root = store.hierarchy[0]
        }
    })

    onMount(async () => {
        const store = await window.api.invoke('getStore')
        if (store && store.hierarchy) {
            root = store.hierarchy[0]
        }
	});

</script>

<style type="text/scss">
    nav {
        background-color: lightgray;
        border: 10px solid red;
    }
</style>

{#if root} 
    <Folder name='{root.name}' children={root.children} expanded hidden />
{/if}