import { remove } from 'fs-extra'

export default async function(path) {
  try {
		await remove(path)
		return { type: 'DELETE_FILE_SUCCESS', path: path }
	} catch(err) {
		return { type: 'DELETE_FILE_FAIL', err: err }
	}
}