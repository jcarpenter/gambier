import { stat } from 'fs-extra'
import { Media } from './index.js'
import path from 'path'


/**
 * For specified path, return document details
 */
export default async function (filePath, stats = undefined, parentId = '', extension = undefined, nestDepth) {

	const media = Object.assign({}, Media)

	if (stats == undefined) {
		stats = await stat(filePath)
	}

	media.name = path.basename(filePath)
  media.filetype = extension == undefined ? path.extname(filePath) : extension
	media.path = filePath
	media.id = `media-${stats.ino}`
	media.parentId = parentId
	media.modified = stats.mtime.toISOString()
	media.created = stats.birthtime.toISOString()
	media.nestDepth = nestDepth

	return media
}