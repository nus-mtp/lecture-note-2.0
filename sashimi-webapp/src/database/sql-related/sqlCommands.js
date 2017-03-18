import StringManipulator from 'src/database/stringManipulation';
import exceptions from 'src/database/exceptions';
import constants from 'src/database/constants';
import DateTime from 'src/database/generated-data/dateTime';

const alasql = require('alasql');

const stringManipulator = new StringManipulator();
const dateTime = new DateTime();

function getDataOutOfAlasql(data) {
  return Object.values(data[0][0])[0];
}

function getSecondDataOutOfAlasql(data) {
  return Object.values(data[0][0])[1];
}

function getArray(data) {
  return data[0];
}

function getCurrentFilePath(fileId) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FILE_MANAGER_PATH,
                                                   ' FROM ', constants.ENTITIES_FILE_MANAGER,
                                                   ' WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                   ' = ', fileId)])
    .then(filePath => resolve(filePath))
    .catch(sqlErr => reject(sqlErr))
  );
}

function getCurrentFolderPath(folderId) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FOLDER_PATH,
                                                   ' FROM ', constants.ENTITIES_FOLDER,
                                                   ' WHERE ', constants.HEADER_FOLDER_FOLDER_ID,
                                                   ' = ', folderId)])
    .then(folderPath => resolve(folderPath))
    .catch(sqlErr => reject(sqlErr))
  );
}

// duplicate private function to help with cascadeChangeFilePath
function changeSingleFilePath(fileId, newPath) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('UPDATE ', constants.ENTITIES_FILE_MANAGER,
                                                   ' SET ', constants.HEADER_FILE_MANAGER_PATH,
                                                   ' = "', newPath,
                                                   '" WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                   ' = ', fileId)])
    .then(() => resolve())
    .catch(sqlError => reject(sqlError))
  );
}

function cascadeChangeFilePath(index, prevBasePath, newBasePath, fileArr) {
  return new Promise((resolve, reject) => {
    if (index >= fileArr.length) {
      return true;
    }
    const fileToChangePathIndex = Object.values(fileArr[index])[0];
    let newPath;
    return getCurrentFilePath(fileToChangePathIndex)
    .then((currentFilePath) => {
      const childPath = currentFilePath.toString().split(prevBasePath)[1];
      newPath = stringManipulator.stringConcat(newBasePath, childPath);
      return changeSingleFilePath(fileToChangePathIndex, newPath)
      .catch(sqlErr => reject(sqlErr));
    })
    .then(() => {
      cascadeChangeFilePath(index + 1, prevBasePath, newBasePath, fileArr)
      .catch(err => reject(err));
      resolve();
    })
    .catch(err => reject(err));
  });
}

function changeSingleFolderPath(folderId, newPath) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('UPDATE ', constants.ENTITIES_FOLDER,
                                                   ' SET ', constants.HEADER_FOLDER_PATH,
                                                   ' = "', newPath,
                                                   '" WHERE ', constants.HEADER_FOLDER_FOLDER_ID,
                                                   ' = ', folderId)])
    .then(() => resolve())
    .catch(sqlError => reject(sqlError))
  );
}

function changeSingleFolderName(folderId, newFolderName) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('UPDATE ', constants.ENTITIES_FOLDER,
                                                   ' SET ', constants.HEADER_FOLDER_FOLDER_NAME,
                                                   ' = "', newFolderName,
                                                   '" WHERE ', constants.HEADER_FOLDER_FOLDER_ID,
                                                   ' = ', folderId)])
    .then(() => resolve())
    .catch(sqlError => reject(sqlError))
  );
}

function cascadeChangeFolderPath(index, prevBasePath, newBasePath, folderArr) {
  return new Promise((resolve, reject) => {
    if (index >= folderArr.length) {
      return true;
    }
    const folderToChangePathIndex = Object.values(folderArr[index])[0];
    let newPath;
    return getCurrentFolderPath(folderToChangePathIndex)
    .then((currentFolderPath) => {
      const childPath = currentFolderPath.toString().split(prevBasePath)[1];
      newPath = stringManipulator.stringConcat(newBasePath, childPath);
      return changeSingleFolderPath(folderToChangePathIndex, newPath)
      .catch(sqlErr => reject(sqlErr));
    })
    .then(() => {
      cascadeChangeFolderPath(index + 1, prevBasePath, newBasePath, folderArr)
      .catch(err => reject(err));
      resolve();
    })
    .catch(err => reject(err));
  });
}

function deleteSingleFolder(folderId) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('DELETE FROM ', constants.ENTITIES_FOLDER,
                                                   ' WHERE ', constants.HEADER_FOLDER_FOLDER_ID,
                                                   ' = ', folderId)])
    .then(() => resolve())
    .catch(sqlError => reject(sqlError))
  );
}

function cascadeDeleteFolder(index, folderArr) {
  return new Promise((resolve, reject) => {
    if (index >= folderArr.length) {
      return true;
    }
    const folderToDeleteIndex = Object.values(folderArr[index])[0];
    return deleteSingleFolder(folderToDeleteIndex)
    .then(() => {
      cascadeDeleteFolder(index + 1, folderArr)
      .catch(err => reject(err));
      resolve();
    })
    .catch(err => reject(err));
  });
}

// duplicate private function to help with cascadeDeleteFile
function deleteSingleFile(fileId) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('DELETE FROM ', constants.ENTITIES_FILE_MANAGER,
                                                   ' WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                   ' = ', fileId)])
    .then(() => resolve())
    .catch(sqlError => reject(sqlError))
  );
}

function cascadeDeleteFile(index, fileArr) {
  return new Promise((resolve, reject) => {
    if (index >= fileArr.length) {
      return true;
    }
    const fileToDeleteIndex = Object.values(fileArr[index])[0];
    return deleteSingleFile(fileToDeleteIndex)
    .then(() => {
      cascadeDeleteFile(index + 1, fileArr)
      .catch(err => reject(err));
      resolve();
    })
    .catch(err => reject(err));
  });
}

function getFolderPathAndNameFromId(folderId) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FOLDER_PATH,
                                                   ', ', constants.HEADER_FOLDER_FOLDER_NAME,
                                                   ' FROM ', constants.ENTITIES_FOLDER,
                                                   ' WHERE ', constants.HEADER_FOLDER_FOLDER_ID,
                                                   ' = ', folderId)])
    .then(data => resolve(data))
    .catch(sqlErr => reject(sqlErr))
  );
}

function getListOfFolderIdsWithSamePath(folderPath) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FOLDER_FOLDER_ID,
                                                   ' FROM ', constants.ENTITIES_FOLDER,
                                                   ' WHERE ', constants.HEADER_FOLDER_PATH,
                                                   ' LIKE "', folderPath, '%"')])
    .then(folderList => resolve(folderList))
    .catch(sqlErr => reject(sqlErr))
  );
}

function getListOfFilesIdsWithSamePath(folderPath) {
  return new Promise((resolve, reject) =>
    alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                   ' FROM ', constants.ENTITIES_FILE_MANAGER,
                                                   ' WHERE ', constants.HEADER_FILE_MANAGER_PATH,
                                                   ' LIKE "', folderPath, '%"')])
    .then(fileList => resolve(fileList))
    .catch(sqlErr => reject(sqlErr))
  );
}

export default function sqlCommands() {
  this.linkDatabaseToIndexedDB = function linkDatabaseToIndexedDB(databaseName) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) => {
        const databaseRequestStr = stringManipulator.stringConcat(
          'CREATE INDEXEDDB DATABASE IF NOT EXISTS ', databaseName, ';',
          'ATTACH INDEXEDDB DATABASE ', databaseName, ';',
          'USE ', databaseName, ';');
        return alasql.promise([databaseRequestStr])
        .then(() => resolve(true))
        .catch(sqlError => reject(sqlError));
      });
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.getFullTableData = function getFullTableData(tableName) {
    // ensure working in browsers that support Promise
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT * FROM ', tableName)])
        .then(data => resolve(getArray(data)))
        .catch(sqlError => reject(sqlError)));
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.createTable = function createTable(sqlStatement) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('CREATE TABLE IF NOT EXISTS ', sqlStatement)])
        .then(() => resolve(true))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.insertContent = function insertContent(tableName, alasqlArray) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise(stringManipulator.stringConcat('INSERT INTO ', tableName,
                                                       ' VALUES ?'), alasqlArray)
        .then(data => resolve(data))
        .catch(sqlError => reject(sqlError)));
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.partialSearchFileName = function partialSearchFileName(searchString) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT * FROM ', constants.ENTITIES_FILE_MANAGER,
                                                       ' WHERE ', constants.HEADER_FILE_MANAGER_FILE_NAME,
                                                       ' LIKE "%', searchString, '%"')])
        .then(data => resolve(getArray(data)))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.exactSearchStartFileNameInFolder = function exactSearchStartFileNameInFolder(searchString, filePath) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FILE_MANAGER_FILE_NAME,
                                                       ' FROM ', constants.ENTITIES_FILE_MANAGER,
                                                       ' WHERE ', constants.HEADER_FILE_MANAGER_PATH,
                                                       ' LIKE "', filePath, '%"',
                                                       ' ORDER BY ', constants.HEADER_FILE_MANAGER_FILE_NAME,
                                                       ' ASC')])
        .then(data => resolve(getArray(data)))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.exactSearchStartFolderNameInFolder = function exactSearchStartFolderNameInFolder(searchString, parentFolderId) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FOLDER_FOLDER_NAME,
                                                       ' FROM ', constants.ENTITIES_FOLDER,
                                                       ' WHERE ', constants.HEADER_FOLDER_PARENT_FOLDER_ID,
                                                       ' = ', parentFolderId,
                                                       ' ORDER BY ', constants.HEADER_FOLDER_FOLDER_NAME,
                                                       ' ASC')])
        .then(data => resolve(getArray(data)))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.getMaxFileId = function getMaxFileId() {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT max(', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                       ') FROM ', constants.ENTITIES_FILE_MANAGER)])
        .then((data) => {
          const maxFileId = getDataOutOfAlasql(data);
          if (typeof maxFileId === 'number') {
            resolve(maxFileId);
          } else {
            resolve(-1);
          }
        }).catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };
  this.getMaxFolderId = function getMaxFolderId() {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT MAX(', constants.HEADER_FOLDER_FOLDER_ID,
                                                       ') FROM ', constants.ENTITIES_FOLDER)])
        .then((data) => {
          const maxFolderId = getDataOutOfAlasql(data);
          if (typeof maxFolderId === 'number') {
            resolve(maxFolderId);
          } else {
            resolve(0);
          }
        }).catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.partialSearchFolderName = function partialSearchFolderName(searchString) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT * FROM ', constants.ENTITIES_FOLDER,
                                                       ' WHERE ', constants.HEADER_FOLDER_FOLDER_NAME,
                                                       ' LIKE "%', searchString, '%"')])
        .then(data => resolve(getArray(data)))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.loadFilesFromFolder = function loadFilesFromFolder(folderId) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT * FROM ', constants.ENTITIES_FILE_MANAGER,
                                                       ' WHERE ', constants.HEADER_FILE_MANAGER_FOLDER_ID,
                                                       ' = ', folderId)])
        .then(data => resolve(getArray(data)))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.loadFoldersFromFolder = function loadFoldersFromFolder(folderId) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT * FROM ', constants.ENTITIES_FOLDER,
                                                       ' WHERE ', constants.HEADER_FOLDER_PARENT_FOLDER_ID,
                                                       ' = ', folderId)])
        .then(data => resolve(getArray(data)))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.loadFile = function loadFile(fileId) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('SELECT ', constants.HEADER_FILE_MANAGER_FILE_MARKDOWN,
                                                       ' FROM ', constants.ENTITIES_FILE_MANAGER,
                                                       ' WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                       ' = ', fileId)])
        .then(data => resolve(getDataOutOfAlasql(data)))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.changeFileName = function changeFileName(fileId, newFileName) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('UPDATE ', constants.ENTITIES_FILE_MANAGER,
                                                       ' SET ', constants.HEADER_FILE_MANAGER_FILE_NAME,
                                                       ' = "', newFileName,
                                                       '" WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                       ' = ', fileId)])
        .then(() => resolve())
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.changeFilePath = function changeFilePath(fileId, newPath) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
      alasql.promise([stringManipulator.stringConcat('UPDATE ', constants.ENTITIES_FILE_MANAGER,
                                                    ' SET ', constants.HEADER_FILE_MANAGER_PATH,
                                                    ' = "', newPath,
                                                    '" WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                    ' = ', fileId)])
      .then(() => resolve())
      .catch(sqlError => reject(sqlError))
        );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.changeFolderName = function changeFolderName(folderId, newFolderName) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) => {
        let prevFolderPath;
        let thisFolderPath;
        let newFolderPath;
        let foldersToChangePath;
        let filesToChangePath;
        // step 1: get the folder path and folder name
        return getFolderPathAndNameFromId(folderId)
        .then((folderData) => {
          // step 2: get all the folders to have their path and name changed
          prevFolderPath = getDataOutOfAlasql(folderData);
          const thisFolderName = getSecondDataOutOfAlasql(folderData);
          thisFolderPath = stringManipulator.stringConcat(prevFolderPath, thisFolderName, '/');
          newFolderPath = stringManipulator.stringConcat(prevFolderPath, newFolderName, '/');
          return getListOfFolderIdsWithSamePath(thisFolderPath)
          .then((folderIds) => {
            foldersToChangePath = getArray(folderIds);
            return null;
          })
          .catch(sqlError => reject(sqlError));
        })
        .then(() =>
          // step 3: get all the files to be deleted
          getListOfFilesIdsWithSamePath(thisFolderPath)
          .then((fileIds) => {
            filesToChangePath = getArray(fileIds);
            return '';
          })
          .catch(sqlError => reject(sqlError))
        )
        .then(() =>
          // step 6: change current folder name to new name
          changeSingleFolderName(folderId, newFolderName)
          .catch(sqlErr => reject(sqlErr))
        )
        .then(() =>
          // step 4: cascade change folder path of all the current and children folders
          cascadeChangeFolderPath(0, thisFolderPath, newFolderPath, foldersToChangePath)
          .catch(sqlErr => reject(sqlErr))
        )
        .then(() =>
          // step 5: cascade change folder path of all children files
          cascadeChangeFilePath(0, thisFolderPath, newFolderPath, filesToChangePath)
          .catch(sqlErr => reject(sqlErr))
        )
        .then(() => resolve())
        .catch(sqlError => reject(sqlError));
      });
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.saveFile = function saveFile(fileId, markdownFile) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('UPDATE ', constants.ENTITIES_FILE_MANAGER,
                                                       ' SET ', constants.HEADER_FILE_MANAGER_FILE_MARKDOWN,
                                                       ' = "', markdownFile,
                                                       '" WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                       ' = ', fileId)])
          .catch(sqlError => reject(sqlError))
        .then(() => {
          const currentDateTime = dateTime.getCurrentDateTime();
          return alasql.promise([stringManipulator.stringConcat('UPDATE ', constants.ENTITIES_FILE_MANAGER,
                                                         ' SET ', constants.HEADER_FILE_MANAGER_LAST_MODIFIED_DATE,
                                                         ' = "', currentDateTime,
                                                         '" WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                         ' = ', fileId)])
          .catch(sqlError => reject(sqlError));
        })
        .then(() => resolve(true))
        .catch(sqlErr => reject(sqlErr)));
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.deleteFile = function deleteFile(fileId) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('DELETE FROM ', constants.ENTITIES_FILE_MANAGER,
                                                       ' WHERE ', constants.HEADER_FILE_MANAGER_FILE_ID,
                                                       ' = ', fileId)])
        .then(() => resolve())
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  this.deleteFolder = function deleteFolder(folderId) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) => {
        let thisFolderPath;
        let foldersToDelete;
        let filesToDelete;
        // step 1: get the folder path and folder name
        return getFolderPathAndNameFromId(folderId)
        .then((folderData) => {
          // step 2: get all the folders to be deleted
          thisFolderPath = getDataOutOfAlasql(folderData);
          const thisFolderName = getSecondDataOutOfAlasql(folderData);
          thisFolderPath = stringManipulator.stringConcat(thisFolderPath, thisFolderName, '/');
          return getListOfFolderIdsWithSamePath(thisFolderPath)
          .then((folderIds) => {
            foldersToDelete = getArray(folderIds);
            return null; // dummy return
          })
          .catch(sqlError => reject(sqlError));
        })
        .then(() =>
          // step 3: get all the files to be deleted
          getListOfFilesIdsWithSamePath(thisFolderPath)
          .then((fileIds) => {
            filesToDelete = getArray(fileIds);
            return null; // dummy return
          })
          .catch(sqlError => reject(sqlError))
        )
        .then(() =>
          // step 4: cascade delete all the current and children folders
          cascadeDeleteFolder(0, foldersToDelete)
          .then(() => {})
          .catch(sqlErr => reject(sqlErr))
        )
        .then(() =>
          // step 5: cascade delete all children files
          cascadeDeleteFile(0, filesToDelete)
          .then(() => {})
          .catch(sqlErr => reject(sqlErr))
        )
        .then(() => resolve())
        .catch(sqlError => reject(sqlError));
      });
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };

  // external library not functioning so I cannot do anything here
  this.deleteTable = function deleteTable(tableName) {
    if (typeof Promise === 'function') {
      return new Promise((resolve, reject) =>
        alasql.promise([stringManipulator.stringConcat('DROP TABLE IF EXISTS ', tableName)])
        .then(isSuccess => resolve(isSuccess))
        .catch(sqlError => reject(sqlError))
      );
    } else {
      throw new exceptions.PromiseFunctionNotDefined();
    }
  };
}
