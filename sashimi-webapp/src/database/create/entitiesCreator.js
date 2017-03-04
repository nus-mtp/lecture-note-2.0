import constants from '../constants';
import tableCreator from './tableCreator';
import SqlCommands from '../sql-related/sqlCommands';
import DateTime from '../generated-data/dateTime';
import exceptions from '../exceptions';
import StringManipulator from '../stringManipulation';

const sqlCommands = new SqlCommands();
const dateTime = new DateTime();
const stringManipulator = new StringManipulator();

function getFormattedCurrentDateTime() {
  return stringManipulator.stringConcat('"', dateTime.getCurrentDateTime(), '"');
}

function isTableExists(tableName) {
  sqlCommands.getFullTableData(tableName)
    .then(data => true).catch(sqlErr => false);
}

function defaultFillUpUserTable() {
  if (isTableExists(constants.ENTITIES_USER)) {
    const userToken = '"temporary"';
    const password = '""';
    const email = '"default@email.com"';
    const username = constants.DEFAULT_USER_NAME;
    const userId = constants.DEFAULT_USER_ID;
    const creationDate = getFormattedCurrentDateTime();

    sqlCommands.insertContent(constants.ENTITIES_USER,
                              userToken,
                              password,
                              email,
                              username,
                              userId,
                              creationDate)
    .then().catch(err => err);
  } else {
    throw new exceptions.IllegalAccessToUserTable();
  }
}

export default class entitiesCreator {

  static constuctor() {}

  static initializeDatabase() {
    tableCreator.callSqlToLinkToDatabase();
  }

  static createUserTable() {
    try {
      tableCreator.initCreateTable(constants.ENTITIES_USER);

      tableCreator.addHeader(constants.HEADER_USER_TOKEN, 'STRING');
      tableCreator.addHeader(constants.HEADER_USER_PASSWORD, 'STRING');
      tableCreator.addHeader(constants.HEADER_USER_EMAIL, 'STRING');
      tableCreator.addHeader(constants.HEADER_USER_USERNAME, 'STRING');
      tableCreator.addHeader(constants.HEADER_USER_USER_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_USER_CREATION_DATE, 'DATE');

      tableCreator.setPrimaryKeys(constants.HEADER_USER_USER_ID);

      const isTableCreatedSuccessful = tableCreator.endCreateTable();

      return isTableCreatedSuccessful;
    } catch (TableCreationAlreadyInitiated) {
      throw TableCreationAlreadyInitiated;
    }
  }

  static createOrganizationTable() {
    try {
      tableCreator.initCreateTable(constants.ENTITIES_ORGANIZATION);

      tableCreator.addHeader(constants.HEADER_ORGANIZATION_ORGANIZATION_NAME, 'STRING');
      tableCreator.addHeader(constants.HEADER_ORGANIZATION_CREATION_DATE, 'DATE');
      tableCreator.addHeader(constants.HEADER_ORGANIZATION_ORGANIZATION_TYPE, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_ORGANIZATION_ORGANIZATION_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_ORGANIZATION_USER_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_ORGANIZATION_PARENT_ORGANIZATION_ID, 'NUMBER');

      tableCreator.setForeignKey(constants.HEADER_ORGANIZATION_USER_ID,
                                 constants.ENTITIES_USER,
                                 constants.HEADER_USER_USER_ID);

      tableCreator.setPrimaryKeys(constants.HEADER_ORGANIZATION_ORGANIZATION_ID,
                                    constants.HEADER_ORGANIZATION_USER_ID);

      const isTableCreatedSuccessful = tableCreator.endCreateTable();

      return isTableCreatedSuccessful;
    } catch (TableCreationAlreadyInitiated) {
      throw TableCreationAlreadyInitiated;
    }
  }

  static createFileManagerTable() {
    try {
      tableCreator.initCreateTable(constants.ENTITIES_FILE_MANAGER);

      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_ORGANIZATION_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_FOLDER_ID, 'STRING');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_FILE_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_FILE_NAME, 'STRING');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_FILE_MARKDOWN, 'STRING');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_PERMISSION_INDEX, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_CREATION_DATE, 'DATE');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_LAST_MODIFIED_DATE, 'DATE');
      tableCreator.addHeader(constants.HEADER_FILE_MANAGER_PATH, 'STRING');

      tableCreator.setPrimaryKeys(constants.HEADER_FILE_MANAGER_FILE_ID,
                                    constants.HEADER_FILE_MANAGER_ORGANIZATION_ID);

      const isTableCreatedSuccessful = tableCreator.endCreateTable();

      return isTableCreatedSuccessful;
    } catch (TableCreationAlreadyInitiated) {
      throw TableCreationAlreadyInitiated;
    }
  }

  static createFolderTable() {
    try {
      tableCreator.initCreateTable(constants.ENTITIES_FOLDER);

      tableCreator.addHeader(constants.HEADER_FOLDER_FOLDER_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FOLDER_PARENT_FOLDER_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FOLDER_PERMISSION_INDEX, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FOLDER_ORGANIZATION_ID, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FOLDER_CREATION_DATE, 'DATE');
      tableCreator.addHeader(constants.HEADER_FOLDER_FOLDER_NAME, 'NUMBER');
      tableCreator.addHeader(constants.HEADER_FOLDER_LAST_MODIFIED_DATE, 'DATE');
      tableCreator.addHeader(constants.HEADER_FOLDER_PATH, 'STRING');

      tableCreator.setPrimaryKeys(constants.HEADER_FOLDER_ORGANIZATION_ID,
                                    constants.HEADER_FOLDER_FOLDER_ID);
      const isTableCreatedSuccessful = tableCreator.endCreateTable();

      return isTableCreatedSuccessful;
    } catch (TableCreationAlreadyInitiated) {
      throw TableCreationAlreadyInitiated;
    }
  }

}