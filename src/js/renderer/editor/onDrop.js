export async function onDrop(cm, evt) {

  evt.codemirrorIgnore = true

  const isMove = evt.altKey == false
  const isCopy = evt.altKey == true
  const project = window.state.projects.byId[window.id]

  // For each file dragged in...
  for (const [key, file] of Object.entries(evt.dataTransfer.files)) {
    
    const isImage = file.type.includes('image')
    const { wasSuccess, destinationPath } = await window.api.invoke('moveOrCopyFileIntoProject', file.path, project.directory, isCopy)
    
    if (wasSuccess && isImage) {
      cm.replaceRange(`![](${destinationPath})`, cm.getCursor())
    }

  }

  // evt.dataTransfer.files.forEach((file) => {
  //   console.log(file)
  // })

  // const file = evt.dataTransfer.files[0]

  console.log(evt)
  // console.log(file)

  // const isImage = 

  // If type is image, create image element
  // If option is copy-images-to-local, copy image to local, and set relative local url
  // Else, set absolute URL to location on local filesystem

  // Copy file into project. Takes current path, and copies it.
  // If alt is pressed, it's a copy operation.
  // Else, it's a move.

}