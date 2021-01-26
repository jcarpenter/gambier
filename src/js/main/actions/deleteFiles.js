import { remove } from 'fs-extra'

// 1/25: TODO: Can probably delete. Moved this into MenuBarManager

export default async function(paths) {
  try {
    let deletedPaths = await Promise.all(
      paths.map(async (path) => {
        await remove(path)
      })
    )
		return { type: 'DELETE_FILES_SUCCESS', paths: deletedPaths }
	} catch(err) {
		return { type: 'DELETE_FILES_FAIL', err: err }
	}
}