import moment from 'moment'

function updateDocList(state, filter) {

  // Get search paramaters
  const filterDateModified = filter.filterDateModified;
  const filterDateCreated = filter.filterDateCreated;

  // Get folder. If `lookInFolderId` is '*', that means "search all folders", so we get the root folder (the one without a parentId). Else, we get the folder specified by `lookInFolderId`.
  const folder = filter.lookInFolderId == '*' ?
    state.folders.find((f) => f.parentId == '') :
    state.folders.find((f) => f.id == filter.lookInFolderId)

  // Get docs for selected folder
  let docs = state.documents.filter((d) => d.parentId == folder.id);

  // If `includeChildren`, get docs for all descendant folders
  if (filter.includeChildren) {
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
  if (filter.tags.length > 0) {
    docs = docs.filter((f) => {
      return filter.tags.some((t) => {
        if (f.tags.includes(t)) {
          return true;
        }
      });
    });
  }

  // If we should use dateModified, we need to validate the dates.
  // E.g. `from` must be before `to`. 
  // If the dates are not valid, we do not apply the filter.
  if (filter.dateModified.use) {

    // Start by copying the input from and to values
    let from = filter.dateModified.from
    let to = filter.dateModified.to

    // Convert `from` value to date
    if (from == 'NOW' || from == '') {
      from = moment().format()
    } else if (filter.dateModified.from.includes('DAYS-AGO')) {
      let numberOf = from.substring(0, from.indexOf('-'))
      from = moment().subtract(numberOf, 'days')
    } else {
      from = moment(from).format()
    }

    // Convert `to` value to date
    if (filter.dateModified.to.includes('DAYS-AGO')) {
      let numberOf = to.substring(0, to.indexOf('-'))
      to = moment().subtract(numberOf, 'days').format()
    } else {
      to = moment(to).format()
    }

    console.log(from)
    console.log(to)

    if (from > to) {
      docs = docs.filter((f) => {
        const modified = moment(f.modified).format()
        if (modified < from && modified > to) {
          return f
        }
      })
    }
  }

  // Filter by date modified
  // if (filterDateModified) {
  //   const from = new Date(filter.fromDateModified);
  //   const to = new Date(filter.toDateModified);
  //   docs = docs.filter(f => {
  //     const modified = new Date(f.modified);
  //     if (modified < from && modified > to) {
  //       return f;
  //     }
  //   });
  // }

  // // Filter by date modified
  // if (filterDateCreated) {
  //   const from = new Date(filter.fromDateCreated);
  //   const to = new Date(filter.toDateCreated);
  //   docs = docs.filter(f => {
  //     const created = new Date(f.created);
  //     if (created < from && created > to) {
  //       return f;
  //     }
  //   });
  // }

  return docs
}

function sortDocList(docsBefore, sort) {

  let docs = docsBefore

  switch (sort.by) {
    case 'title':
      docs.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'date-modified':
      docs.sort((a, b) => new Date(b.modified) - new Date(a.modified))
      break
    case 'date-created':
      docs.sort((a, b) => new Date(b.created) - new Date(a.created))
      break
  }

  if (sort.order == 'descending') docs.reverse()

  return docs
}

export { updateDocList, sortDocList }