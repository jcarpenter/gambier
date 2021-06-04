import { isImagePath } from "../../shared/utils"

export async function onDrop(cm, evt) {

  evt.codemirrorIgnore = true

  const project = window.state.projects.byId[window.id]
  const isMove = evt.altKey == false
  const isCopy = evt.altKey == true

  // Distinguish local drag from outside app drag
  const isFileId = evt.dataTransfer.types.includes('text/fileid')
  const isExternalFile = evt.dataTransfer.types.includes('Files')

  if (isFileId) {
    
    const id = evt.dataTransfer.getData('text/fileid')
    const file = window.files.byId[id]

    // If file is image, create inline image
    if (file.type == 'img') {
      const cursor = cm.coordsChar({ left: evt.x, top: evt.y })
      // Remove project directory from path, 
      // and convert spaces to ascii spaces.
      // Before: /Users/josh/Desktop/Notes/Images/Desolation Sound.png
      // After:  /Images/Desolation%20Sound.png
      let url = file.path.replace(project.directory, '')
      url = url.replaceAll(' ', '%20')
      const image = `![](${url})`
      cm.replaceRange(image, cursor)
    }
    
    // Else, if file is doc, create link to doc
    // TODO

  }

  return


  // For each file dragged in...
  for (const [key, file] of Object.entries(evt.dataTransfer.files)) {
    
    const isImage = file.type.includes('image')
    console.log(isImage)
    const { wasSuccess, destinationPath } = await window.api.invoke('moveOrCopyFileIntoProject', file.path, project.directory, isCopy)
    
    if (wasSuccess && isImage) {
      cm.replaceRange(`![](${destinationPath})`, cm.getCursor())
    }
  }

  console.log(evt)


  // evt.dataTransfer.files.forEach((file) => {
  //   console.log(file)
  // })

  // const file = evt.dataTransfer.files[0]

  // console.log(file)

  // const isImage = 

  // If type is image, create image element
  // If option is copy-images-to-local, copy image to local, and set relative local url
  // Else, set absolute URL to location on local filesystem

  // Copy file into project. Takes current path, and copies it.
  // If alt is pressed, it's a copy operation.
  // Else, it's a move.

}