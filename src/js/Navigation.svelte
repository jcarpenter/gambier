<script>
    import * as config from '../config.js'
    import Folder from './Folder.svelte'

    let items;
    let root
    let rootChildren = []

    window.api.receive('projectDirectoryStoreUpdated', (newValue) => {
        if (newValue.hierarchy && newValue.hierarchy[0] !== root) {
            root = newValue.hierarchy[0]
        }
    })

</script>

<style>
    nav {
        background-color: lightgray;
        border: 10px solid red;
    }
</style>

{#if root} 
    <Folder name='{root.name}' children={root.children} expanded hidden />
{/if}