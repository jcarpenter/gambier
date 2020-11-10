function makeSideBarItem(type, label, id, parentId, icon, showFilesList, filter, sort) {
  
  const item = {
    type: type ? type : '',
    label: label ? label : '',
    id: id ? id : '',
    parentId: parentId ? parentId : '',
    icon: icon ? icon : 'images/sidebar-default-icon.svg',
    showFilesList: showFilesList ? showFilesList : false,
    filter: filter ? filter : {
      lookInFolderId: '*',
      includeChildren: true,
      filetypes: ['*'],
      tags: [],
      dateModified: { use: false, from: '', to: '' },
      dateCreated: { use: false, from: '', to: '' },
    },
    sort: sort ? sort : { by: 'title', order: 'ascending' },
    files: [],    
    lastScrollPosition: 0,
    expanded: true,
    children: [],
  }

  return item
}

export { makeSideBarItem }