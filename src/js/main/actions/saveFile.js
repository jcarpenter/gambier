import { writeFile } from 'fs-extra'

export default async function (path, data) {
	try {
		await writeFile(path, data, 'utf8')
		return {
			type: 'SAVE_FILE_SUCCESS',
			path: path,
		}
	} catch (err) {
		return {
			type: 'SAVE_FILE_FAIL',
			err: err
		}
	}
}