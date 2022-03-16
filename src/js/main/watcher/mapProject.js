import { mapFolder } from './mapFolder'

/**
 * Map project path recursively and dispatch results to store
 * @param {*} projectPath 
 */
export async function mapProject (projectPath) {

  try {

    const files = {
      tree: [],
      byId: {},
      allIds: []
    }

    // Map project path, recursively
    await mapFolder(files, files.tree, projectPath)
    
    return files
    
  } catch (err) {
    console.log(err)
  }
}