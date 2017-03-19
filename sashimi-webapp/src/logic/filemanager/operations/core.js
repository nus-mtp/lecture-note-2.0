import storage from 'src/database/storage';
import Folder from '../data/folder';
import File from '../data/file';
import idMap from '../data/idmap';

/* Constants */
const NO_PARENT_ID = -1;

/* Private Functions */
function queueIsEmpty(queue) {
  return queue.length <= 0;
}

function removeElementAtIndex(queue, index) {
  if (index === NO_PARENT_ID) {
    return null;
  } else {
    return queue.splice(index, 1)[0];
  }
}

function getChildFile(queue, parentID) {
  parentID = (parentID == null) ? NO_PARENT_ID: parentID;
  const index = queue.findIndex(dbFileObj => dbFileObj.folder_id === parentID);
  return removeElementAtIndex(queue, index);
}

function getChildFolder(queue, parentID) {
  parentID = (parentID == null) ? NO_PARENT_ID: parentID;
  const index = queue.findIndex(dbFolderObj => dbFolderObj.parent_folder_id === parentID);
  return removeElementAtIndex(queue, index);
}

/* Filemanager core functions */
const core = {

  /**
   * Load all files and folders from database
   *
   * @return {Promise}
   */
  loadDB: function loadDB() {
    return storage.loadAllFilesAndFolders();
  },

  /**
   * Initialize Filemanager
   *
   * @return {Folder}
   */
  init: function init(dbList) {
    const dbFileList = dbList.shift(); // list of File from database list
    const dbFolderList = dbList.shift(); // list of Folder from datbase list

    const processingQueue = [];
    const dbRootFolderObj = getChildFolder(dbFolderList);
    const rootFolder = new Folder(dbRootFolderObj.folder_id, dbRootFolderObj.folder_name, dbRootFolderObj.folder_path);
    processingQueue.push(rootFolder);
    idMap.addFolderToMap(rootFolder.id, rootFolder);

    let currFolder;
    let dbFileObj;
    let dbFolderObj;
    let childFile;
    let childFolder;
    while (!queueIsEmpty(processingQueue)) {
      currFolder = processingQueue.shift();
      /* Process dbFileList for child file */
      while ((dbFileObj = getChildFile(dbFileList, currFolder.id)) !== null) {
        childFile = new File(dbFileObj.file_id, dbFileObj.file_name, dbFileObj.file_path, currFolder);
        idMap.addFileToMap(childFile.id, childFile);
        currFolder.childFileList.push(childFile);
      }

          /* Process dbFolderList for child folder */
      while ((dbFolderObj = getChildFolder(dbFolderList, currFolder.id)) !== null) {
        childFolder = new Folder(dbFolderObj.folder_id, dbFolderObj.folder_name, dbFolderObj.folder_path);
        processingQueue.push(childFolder);
        idMap.addFolderToMap(childFolder.id, childFolder);
        childFolder.parentFolder = currFolder;
        currFolder.childFolderList.push(childFolder);
      }
    }
    return rootFolder;
  },

  getFile: function getFile(id) {
    return idMap.getFileFromMap(id);
  },

  getFolder: function getFolder(id) {
    return idMap.getFolderFromMap(id);
  }

};

export default core;
