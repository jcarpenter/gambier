import { writeFile } from 'fs-extra'
import path from 'path';
import { getSideBarItemById } from '../utils-main'

export default async function (state) {

  let id, folder

  let sideBarItem = getSideBarItemById(state, state.selectedSideBarItem.id);

  if(sideBarItem.type == 'folder') {
    id = sideBarItem.id
    folder = state.folders.find((i) => i.id == id)
  } else {
    // TODO
  }

  // The file name of our new file 
  let fileName = 'Untitled-';
  let fileNameIncrement = 1;

  // Get all documents in the selected folder with `fileName` in their name
  // E.g. 'Untitled-1', 'Untitled-222', 'Untitled-3', etc.
  let docs = state.documents.filter((d) => d.parentId == folder.id && d.title.includes(fileName));

  // Does `docs` already contain a file with the exact same file name?
  function fileAlreadyExists() {
    // We use `path.parse(d.path).base` to get the file name from the file path
    // Docs: https://nodejs.org/api/path.html#path_path_parse_path 
    return docs.some((d) => path.parse(d.path).base == `${fileName}${fileNameIncrement}.md`)
  }

  // While the file already exists, increment `fileNameIncrement` until it doesn't. 
  while (fileAlreadyExists()) {
    fileNameIncrement++
  }

  let filePath = `${folder.path}/${fileName}${fileNameIncrement}.md`

  // console.log(state)
  // return

  try {
  	await writeFile(filePath, 'Testing', 'utf8')
  	return {
  		type: ' NEW_FILE_SUCCESS',
  		filePath: filePath,
  	}
  } catch (err) {
  	return {
  		type: 'NEW_FILE_FAIL',
  		err: err
  	}
  }
}