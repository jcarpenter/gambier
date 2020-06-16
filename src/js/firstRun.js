let el
let selectProjectDirectory

function setVisibility(projectDirectory) {
  if (projectDirectory == 'undefined') {
    if (el.classList.contains('hidden')) {
      el.classList.remove('hidden')
    }
  } else {
    if (!el.classList.contains('hidden')) {
      el.classList.add('hidden')
      console.log("hiding firstRun")
    }
  }
}

async function setup(initialState) {
  
  el = document.querySelector('#firstrun')
  selectProjectDirectory = el.querySelector('button')
  
  // Create button click event handler
  selectProjectDirectory.onclick = () => {
    window.api.send('selectProjectDirectory')
  }

  // Setup change listeners
  window.api.receive('stateChanged', async (state, oldState) => {
    if (state.changed.includes('projectDirectory')) {
      setVisibility(state.projectDirectory)
    }
  })

  // Set initial visibility
  setVisibility(initialState.projectDirectory)
}

export { setup }
