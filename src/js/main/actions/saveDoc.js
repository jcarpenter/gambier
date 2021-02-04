import { writeFile } from 'fs-extra'

export default async function (doc, data, panelIndex) {
	try {
		await writeFile(doc.path, data, 'utf8')
		return {
			type: 'SAVE_DOC_SUCCESS',
			panelIndex: panelIndex,
		}
	} catch (err) {
		return {
			type: 'SAVE_DOC_FAIL',
			err: err
		}
	}
}