import { dialog } from 'electron'
import { writeFile } from 'fs-extra'

export default async function (doc, data, isNewDoc, panelIndex, window) {

  const project = global.state().projects.byId[window.projectId]

  let defaultPath = isNewDoc ? 
    `${project.directory}/Untitled.md` : 
    doc.path

  const { filePath, canceled } = await dialog.showSaveDialog(window, {
    defaultPath: defaultPath
  })

  if (canceled) {
    return {
      type: 'SAVE_DOC_CANCELLED',
      panelIndex: panelIndex,
    }
  } else {

    try {
      await writeFile(filePath, data, 'utf8')
      return {
        type: 'SAVE_AS_SUCCESS',
        filePath,
        panelIndex: panelIndex,
      }
    } catch (err) {
      return {
        type: 'SAVE_DOC_FAIL',
        err: err
      }
    }
  }


  // try {
  // 	await writeFile(doc.path, data, 'utf8')
  // 	return {
  // 		type: 'SAVE_DOC_SUCCESS',
  // 		panelIndex: panelIndex,
  // 	}
  // } catch (err) {
  // 	return {
  // 		type: 'SAVE_DOC_FAIL',
  // 		err: err
  // 	}
  // }
}