const Folder = {
  type: 'folder',
  label: '',
  id: '',
  parentId: '',
  isRoot: false,
  icon: 'images/folder.svg',
  showFilesList: true,
  searchParams: {
    lookInFolderId: '',
    includeChildren: false
  },
  selectedFileId: '',
  lastScrollPosition: 0,
  lastSelection: [],
}

export { Folder }