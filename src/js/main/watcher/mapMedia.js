import { stat } from 'fs-extra'
import path from 'path'
import { getMediaType } from '../../shared/utils'
import sizeOf from 'image-size'

/**
 * For specified path, return document details
 */
export async function mapMedia (filepath, parentId, nestDepth, stats = undefined) {

	if (stats == undefined) stats = await stat(filepath)
	const extension = path.extname(filepath)
	const type = getMediaType(extension)
	const { width, height, type: format } = sizeOf(filepath)

	return {
		type: type,
		name: path.basename(filepath),
		path: filepath,
		id: `${type}-${stats.ino}`,
		parentId: parentId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth: nestDepth,
		// --- Media-specific --- //
		format: format,
		sizeInBytes: stats.size,
		dimensions: { width: width, height: height },
	}
}