import { mapFolder } from './index.js'
import { isWorkingPath } from '../utils-main'

/**
 * Map project path recursively and dispatch results to store
 * @param {*} projectPath 
 */
export default async function(projectPath) {

  // await isWorkingPath(directory)
  // if (!isWorkingPath) {
  //   console.error('directory is not valid')
  // }
  
  try {

    const files = {
      folders: {
        byId: {},
        allIds: []
      },
      docs: {
        byId: {},
        allIds: []
      },
      media: {
        byId: {},
        allIds: []
      }
    }

    // Map project path, recursively
    return await mapFolder(files, projectPath, undefined, '', true, 0)
    // console.log(JSON.stringify(files, null, 2))
    
    // Dispatch results to store
    // store.dispatch({
    //   type: 'MAP_PROJECT_CONTENTS',
    //   folders: folders,
    //   documents: documents,
    //   media: media,
    // })

  } catch (err) {
    console.log(err)
  }
}