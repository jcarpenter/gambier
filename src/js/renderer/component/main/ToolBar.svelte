<script>
import IconButton from "../ui/IconButton.svelte";
import AddressBar from "./AddressBar.svelte";

export let state = {}

function todo() {
    console.log('Toolbar.svelte: TODO')
}

</script>

<style type="text/scss">
    #address-bar {
        width: 100%;
        height: 40px;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 5px;
    }

</style>

<div id="address-bar">
    <IconButton tooltip={'Show sidebar'} icon={'--img-sidebar-left'} on:mousedown={todo} />
    <AddressBar {state} />
    <IconButton icon={'--img-rectangle-grid-2x2'} on:mousedown={todo} />
</div>