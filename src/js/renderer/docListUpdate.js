function updateDocList(state, searchParams) {

  // Get search paramaters
  const filterDateModified = searchParams.filterDateModified;
  const filterDateCreated = searchParams.filterDateCreated;

  // Get folder. If `lookInFolderId` is '*', that means "search all folders", so we get the root folder (the one without a parentId). Else, we get the folder specified by `lookInFolderId`.
  const folder = searchParams.lookInFolderId == '*' ? 
    state.folders.find((f) => f.parentId == '') : 
    state.folders.find((f) => f.id == searchParams.lookInFolderId)

  // Get docs for selected folder
  let docs = state.documents.filter((d) => d.parentId == folder.id);

  console.log(searchParams)

  // If `includeChildren`, get docs for all descendant folders
  if (searchParams.includeChildren) {
    // Get ids of child folders
    let childFolderIds = getChildFolderIds(folder);

    // Add docs in child folders
    state.documents.forEach((c) => {
      if (childFolderIds.includes(c.parentId)) {
        docs.push(c);
      }
    });
  }

  /**
   * Get all the child folder ids of specified folder, recursively.
   * @param {*} parentFolder 
   */
  function getChildFolderIds(parentFolder) {
    
    let ids = [];

    state.folders.forEach((f) => {
      if (f.parentId == parentFolder.id) {
        // Push id of child folder
        ids.push(f.id);

        // Find and add ids of the child's children (recursive)
        ids.concat(getChildFolderIds(f));
      }
    });
    return ids;
  }

  // Set `selected` property to false, by default
  docs.forEach((f) => f.selected = false);

  // Filter by tags
  if (searchParams.tags.length > 0) {
    docs = docs.filter((f) => {
      return searchParams.tags.some((t) => {
        if (f.tags.includes(t)) {
          return true;
        }
      });
    });
  }

  // Filter by date modified
  // if (filterDateModified) {
  //   const from = new Date(searchParams.fromDateModified);
  //   const to = new Date(searchParams.toDateModified);
  //   docs = docs.filter(f => {
  //     const modified = new Date(f.modified);
  //     if (modified < from && modified > to) {
  //       return f;
  //     }
  //   });
  // }

  // // Filter by date modified
  // if (filterDateCreated) {
  //   const from = new Date(searchParams.fromDateCreated);
  //   const to = new Date(searchParams.toDateCreated);
  //   docs = docs.filter(f => {
  //     const created = new Date(f.created);
  //     if (created < from && created > to) {
  //       return f;
  //     }
  //   });
  // }

  return docs
}

function sortDocList(docsBefore, searchParams) {

  let docs = docsBefore

  // Sorting
  let sortKey = "title";
  let sortOrder = "descending";

  if (sortKey == "title") {
    if (sortOrder == "ascending") {
      docs.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder == "descending") {
      docs.sort((a, b) => b.title.localeCompare(a.title));
    }
  }

  return docs  
}

export { updateDocList, sortDocList }