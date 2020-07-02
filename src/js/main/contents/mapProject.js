import { mapFolder } from './index.js'
import { isWorkingPath } from '../utils-main'

/**
 * Map project path recursively and dispatch results to store
 * @param {*} projectPath 
 */
export default async function(projectPath, store) {

  if (projectPath == undefined || store == undefined) {
    console.error('projectPath or store is undefined')
  }

  await isWorkingPath(projectPath)
  if (!isWorkingPath) {
    console.error('projectPath is not valid')
  }
  
  try {

    // Map project path, recursively
    const { folders, documents, media } = await mapFolder(projectPath, undefined, '', true)
    
    // Dispatch results to store
    store.dispatch({
      type: 'MAP_PROJECT_CONTENTS',
      folders: folders,
      documents: documents,
      media: media,
    })

  } catch (err) {
    console.log(err)
  }
}