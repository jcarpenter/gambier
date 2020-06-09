<script>
  //   import { onMount } from "svelte";

  export let caption;
  export let url;
  export let alt;

  //   window.api.receive("stateChanged", state => {
  //     // update(state);
  //   });

  //   onMount(async () => {
  //     // const state = await window.api.invoke("getState");
  //     // update(state);
  //   });
</script>

<style type="text/scss">
  figure {
    width: 100%;
    margin: 0;
    padding: 0;
    display: inline-block;
    // background-color: lightyellow;
    white-space: normal; // Override codemirror line style

    /* 
    Broken image scenario:
    Image alt text sets size 
    */
    img {
      max-width: 10em;
      display: inline-block;
      height: auto;
      border-radius: 3px;

      // For broken images:
      // Hide alt text (per: https://stackoverflow.com/a/46109943).
      // Set `position: relative`, so we can cover with :after.
      text-indent: 100%;
      white-space: nowrap;
      overflow: hidden;
      position: relative;
    }

    // For broken images:
    // Cover broken image and display `src`.
    // Pseudo-elements only appear for "replaced elements", like images.
    // if the external replacement source does not work.
    // Per: https://bitsofco.de/styling-broken-images/
    img:after {
      
      // Undo the text indent set on parent img
      text-indent: 0%;
      content: "\f1c5"" " attr(src);
      color: rgb(100, 100, 100);
      background-color: rgb(240, 240, 240);
      white-space: normal;
      display: block;
      position: absolute;
      z-index: 2;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      //   border: 1px solid gray;
    }

    figcaption {
      font-style: italic;
      color: gray;
    }
  }
</style>

<figure>
  <img src={url} {alt} />
  <figcaption>{caption}</figcaption>
</figure>
