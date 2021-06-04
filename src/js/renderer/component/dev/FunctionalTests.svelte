<script>
  import { files } from "../../FilesManager";
  import { project } from "../../StateManager";
</script>

<style type="text/scss">
  #functionalTests {
    @include system-regular-font;
    margin: 5em;
  }

  button {
    display: block;
    margin: 0.5em 0;
  }
</style>

<div id="functionalTests">

  Project ID: {window.id}<br>
  Directory: {$project.directory}<br>
  Files: {$files.allIds}<br>

  <button
  on:click={() => {
    window.api.send('dispatch', {
      type: 'SET_PROJECT_DIRECTORY',
      directory: "/Users/josh/Desktop/Test notes/Jordan"
    })
  }}
  >SET_PROJECT_DIRECTORY to Jordan</button>

  <button
    on:click={() => {
      window.api.send('dispatch', {
        type: 'SET_PROJECT_DIRECTORY',
        directory: "/Users/josh/Desktop/Test notes/Boris"
      })
    }}
  >SET_PROJECT_DIRECTORY to Boris</button>

  <button
  on:click={() => {
    window.api.send('dispatch', {
      type: 'CREATE_NEW_PROJECT'
    })
  }}
  >CREATE_NEW_PROJECT</button>

</div>