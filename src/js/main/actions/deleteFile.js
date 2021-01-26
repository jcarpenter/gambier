import { remove } from 'fs-extra'

// 1/25: TODO: Can probably delete. Moved this into MenuBarManager
export default async function(path) {
  try {
		await remove(path)
		return { type: 'DELETE_FILE_SUCCESS', path: path }
	} catch(err) {
		return { type: 'DELETE_FILE_FAIL', err: err }
	}
}