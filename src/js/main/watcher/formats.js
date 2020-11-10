export const Document = {
  type: 'doc',
  title: '',
  name: '',
  path: '',
  id: '',
  parentId: '',
  modified: '',
  created: '',
  excerpt: '',
  tags: [],
  nestDepth: 0,
}

export const Folder = {
  type: 'folder',
  name: '',
  path: '',
  // id: '',
  parentId: '',
  modified: '',
  // directChildCount: 0,
  // recursiveChildCount: 0,
  nestDepth: 0
}

export const Media = {
  type: 'media',
  name: '',
  filetype: '',
  disksize: '',
  path: '',
  id: '',
  parentId: '',
  modified: '',
  created: '',
  nestDepth: 0,
}

export const imageFormats = [
  '.apng', '.bmp', '.gif', '.jpg', '.jpeg', '.jfif', '.pjpeg', '.pjp', '.png', '.svg', '.tif', '.tiff', '.webp'
]

export const avFormats = [
  '.flac', '.mp4', '.m4a', '.mp3', '.ogv', '.ogm', '.ogg', '.oga', '.opus', '.webm'
]