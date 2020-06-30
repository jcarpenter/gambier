import { writeFile } from 'fs-extra'
import { getFileMetadata } from '../contents/index.js'

export default async function(path, data) {
  try {
		await writeFile(path, data, 'utf8')
		const metadata = await getFileMetadata(path, data)
		return { 
			type: 'SAVE_FILE_SUCCESS', 
			path: path, 
			metadata: metadata 
		}
	} catch(err) {
		return { 
			type: 'SAVE_FILE_FAIL', 
			err: err 
		}
	}
}