import { Pos } from "codemirror"
import { isImagePath, wait } from "../../shared/utils"
import { markDoc } from "./mark"

export async function onDrop(cm, evt) {

  evt.codemirrorIgnore = true

  const project = window.state.projects.byId[window.id]
  const isMove = evt.altKey == false
  const isCopy = evt.altKey == true

  // Distinguish local drag from outside app drag
  // TODO: Add support for dragging docs in and creating local links.
  const isDocId = evt.dataTransfer.types.includes('text/docid')
  const isMediaId = evt.dataTransfer.types.includes('text/mediaid')
  const isExternalFile = evt.dataTransfer.types.includes('Files')

  if (isMediaId) {

    const id = evt.dataTransfer.getData('text/mediaid')
    const file = window.files.byId[id]
    const cursor = cm.coordsChar({ left: evt.x, top: evt.y })

    // Remove project directory from path, 
    // and convert spaces to ascii spaces.
    // Before: /Users/josh/Desktop/Notes/Images/Desolation Sound.png
    // After:  /Images/Desolation%20Sound.png
    let url = file.path.replace(project.directory, '')
    url = url.replaceAll(' ', '%20')

    // If file is image, create inline image
    // Else, if file is video, create appropriate element
    if (file.contentType.includes('image')) {

      const image = `![](${url})`
      cm.replaceRange(image, cursor)

    } else if (file.contentType.includes('video')) {

      let video = `<video src="${url}" controls width="100%" height="300"></video>`

      // If drop point is not first character on the line, 
      // create a blank line below the current line, and
      // drop the 
      if (cursor.ch !== 0) {
        // Insert new line character at end of line
        cm.replaceRange('\n', Pos(cursor.line, cm.getLine(cursor.line).length))
        // Increment cursor.line by one, so video element
        // will be created on this blank line
        cursor.line += 1
        cursor.ch = 0
      }

      cm.replaceRange(video, cursor)
      await wait(50)
      markDoc(cm)

    } else if (file.contentType.includes('audio')) {
      console.log('TODO: Support Dropped audio')
    }

    // Else, if file is doc, create link to doc
    // TODO

  }
}
