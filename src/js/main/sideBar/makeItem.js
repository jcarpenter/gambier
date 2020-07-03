function makeItem(type, label, id, parentId, icon, showFilesList, searchParams) {
  
  const item = {
    type: type ? type : '',
    label: label ? label : '',
    id: id ? id : '',
    parentId: parentId ? parentId : '',
    icon: icon ? icon : 'images/sidebar-default-icon.svg',
    showFilesList: showFilesList ? showFilesList : false,
    searchParams: searchParams ? searchParams : {
      lookInFolderId: '*',
      includeChildren: true,
      filetypes: ['*'],
      tags: [],
      filterDateModified: false,
      fromDateModified: '',
      toDateModified: '',
    },
    selectedFileId: '',
    lastScrollPosition: 0,
    lastSelection: [],
    expanded: true,
    children: [],
  }

  return item
}

export { makeItem }


