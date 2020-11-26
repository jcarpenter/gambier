<script>
import ToolbarButton from "../ui/ToolbarButton.svelte";
import AddressBar from "./AddressBar.svelte";

export let state = {}

</script>

<style type="text/scss">
    #address-bar {
        width: 100%;
        // background-color: pink;
        height: 40px;
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 0 5px;
    }

    .sidebarBtn {

    }
</style>

<div id="address-bar">
    <ToolbarButton class="sidebarBtn" iconImage={'--img-sidebar-left'}/>
    <AddressBar {state} />
    <ToolbarButton class="gridBtn" iconImage={'--img-rectangle-grid-2x2'}/>
</div>