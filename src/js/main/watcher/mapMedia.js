import { stat } from 'fs-extra'
import path from 'path'
import { getMediaType } from '../../shared/utils'
import sizeOf from 'image-size'
import mime from 'mime-types'

/**
 * For specified path, return media file details
 */
export async function mapMedia (filepath, parentId, nestDepth, projectId, stats = undefined) {

	if (stats == undefined) stats = await stat(filepath)
	const extension = path.extname(filepath)
	const type = getMediaType(extension)

	const file = {
		isDoc: false,
		isMedia: true,
		contentType: mime.lookup(filepath), // 'image/png', 'video/mp4', etc.
		name: path.basename(filepath),
		path: filepath,
		id: `${type}-${stats.ino}`,
		parentId,
		projectId,
		created: stats.birthtime.toISOString(),
		modified: stats.mtime.toISOString(),
		nestDepth,
		// --- Media-specific --- //
		sizeInBytes: stats.size,
	}

	if (file.contentType.includes('image'))	{
		const { width, height, type: format } = sizeOf(filepath)
		file.dimensions = { width, height }
		file.format = format
	}

	return file
}