function updateFileList(state, searchParams) {

  // Get search paramaters
  const folderId = searchParams.lookInFolderId;
  const includeChildren = searchParams.includeChildren;
  const tags = searchParams.tags;
  const filterDateModified = searchParams.filterDateModified;
  const filterDateCreated = searchParams.filterDateCreated;

  // Get selected folder
  const folder = state.contents.find(
    c => c.type == "folder" && c.id == folderId
  );

  // Get all files for selected folder
  let files = state.contents.filter((c) => c.type == "file" && c.parentId == folderId);

  // TODO:If `includeChildren`, add files of child folders
  if (includeChildren) {
    // Get ids of child folders
    let childFolderIds = getChildFolderIds(folder);

    // Add files in child folders
    state.contents.map(c => {
      if (c.type == "file") {
        if (childFolderIds.includes(c.parentId)) {
          files.push(c);
        }
      }
    });
  }

  function getChildFolderIds(parentFolder) {
    let ids = [];

    const children = state.contents.map(c => {
      if (c.type == "folder" && c.parentId == parentFolder.id) {
        // Push id of child folder
        ids.push(c.id);

        // Find and push ids of the child's children (recursive)
        getChildFolderIds(c).map(m => {
          ids.push(m);
        });
      }
    });
    return ids;
  }

  // Set `selected` property to false, by default
  files.forEach((f) => f.selected = false);

  // Filter by tags
  if (tags && tags.length > 0) {
    files = files.filter(f => {
      return tags.some(t => {
        if (f.tags.includes(t)) {
          return true;
        }
      });
    });
  }

  // Filter by date modified
  if (filterDateModified) {
    const from = new Date(searchParams.fromDateModified);
    const to = new Date(searchParams.toDateModified);
    files = files.filter(f => {
      const modified = new Date(f.modified);
      if (modified < from && modified > to) {
        return f;
      }
    });
  }

  // Filter by date modified
  if (filterDateCreated) {
    const from = new Date(searchParams.fromDateCreated);
    const to = new Date(searchParams.toDateCreated);
    files = files.filter(f => {
      const created = new Date(f.created);
      if (created < from && created > to) {
        return f;
      }
    });
  }

  return files
}

function sortFileList(files, searchParams) {

  let sortedFiles = files

  // Sorting
  let sortKey = "title";
  let sortOrder = "descending";

  if (sortKey == "title") {
    if (sortOrder == "ascending") {
      sortedFiles.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder == "descending") {
      sortedFiles.sort((a, b) => b.title.localeCompare(a.title));
    }
  }

  return sortedFiles  
}

export { updateFileList, sortFileList }