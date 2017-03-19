import tableCreator from 'src/database/create/tableCreator';
import dataDelete from 'src/database/data-modifier/dataDelete';
import exceptions from 'src/database/exceptions';

const testDatabaseName = 'testTableCreator';
let isUsed = false;

function isDatabaseExists(databaseName, callback) {
  const req = indexedDB.open(databaseName);
  let existed = true;
  req.onsuccess = function onSuccess() {
    req.result.close();
    if (!existed) {
      indexedDB.deleteDatabase(databaseName);
    }
    callback(existed);
  };
  req.onupgradeneeded = function onUpgradeNeeded() {
    existed = false;
  };
}

function cleanTestCase() {
  return dataDelete.deleteAllEntities(testDatabaseName);
}

describe('tableCreator', () => {
  before(() =>
    tableCreator.callSqlToLinkToDatabase(testDatabaseName)
  );

  after(() =>
    cleanTestCase()
  );

  describe('link to indexeddb database', () => {
    it('should link to indexeddb database', (done) => {
      if (!window.indexedDB) {
        throw new exceptions.IndexedDBNotSupported();
      }
      tableCreator.callSqlToLinkToDatabase(testDatabaseName)
      .then(() => {
        isDatabaseExists(testDatabaseName, (isDBExists) => {
          expect(isDBExists).to.be.true;
        });
        done();
      })
      .catch(err => done(err));
    });
  });

  describe('table creation', () => {
    it('should throw an error for initialization without closing thread', (done) => {
      if (!isUsed) {
        isUsed = true;
        tableCreator.initCreateTable('abc');
        try {
          tableCreator.initCreateTable('cba');
          expect(false).to.be.true; // should not be executed
        } catch (tableCreationException) {
          expect(tableCreationException.name).to.equal('TableCreationAlreadyInitiated');
        }
        tableCreator.endCreateTable()
        .catch(err => done(err));
        isUsed = false;
        done();
      }
    });

    it('should return null when trying to close thread without initialization', (done) => {
      if (!isUsed) {
        isUsed = true;
        tableCreator.endCreateTable()
        .then(result => expect(result).to.be.null);
        isUsed = false;
        done();
      }
    });

    it('should be allowed to add header', (done) => {
      if (!isUsed) {
        isUsed = true;
        tableCreator.initCreateTable('abc');
        tableCreator.addHeader('a', 'NUMBER');
        tableCreator.addHeader('b', 'STRING');
        tableCreator.addHeader('c', 'DATE');
        tableCreator.endCreateTable()
        .catch(err => expect(err).to.not.equal(Error));
        isUsed = false;
        done();
      }
    });

    it('should be allowed to set foreign key', (done) => {
      if (!isUsed) {
        isUsed = true;
        tableCreator.initCreateTable('abc');
        tableCreator.addHeader('a', 'NUMBER');
        tableCreator.addHeader('b', 'STRING');
        tableCreator.addHeader('c', 'DATE');
        tableCreator.endCreateTable()
        .catch(sqlErr => done(sqlErr))
        .then(() => {
          tableCreator.initCreateTable('cba');
          tableCreator.addHeader('a', 'NUMBER');
          tableCreator.addHeader('b', 'STRING');
          tableCreator.addHeader('c', 'DATE');
          tableCreator.setForeignKey('b', 'abc', 'b');
          tableCreator.endCreateTable()
          .catch(err => expect(err).to.not.equal(Error));
          done();
          isUsed = false;
        });
      }
    });

    it('should be allowed to set primary key', (done) => {
      if (!isUsed) {
        isUsed = true;
        tableCreator.initCreateTable('abc');
        tableCreator.addHeader('a', 'NUMBER');
        tableCreator.addHeader('b', 'STRING');
        tableCreator.addHeader('c', 'DATE');
        tableCreator.setPrimaryKeys('a', 'b', 'c');
        tableCreator.endCreateTable()
        .catch(err => expect(err).to.not.equal(Error));

        tableCreator.initCreateTable('abc');
        tableCreator.addHeader('a', 'NUMBER', 'PRIMARY KEY');
        tableCreator.addHeader('b', 'STRING');
        tableCreator.addHeader('c', 'DATE');
        tableCreator.endCreateTable()
        .catch(err => expect(err).to.not.equal(Error));
        isUsed = false;
        done();
      }
    });

    it('should be allowed to set unique key', (done) => {
      if (!isUsed) {
        isUsed = true;
        tableCreator.initCreateTable('abc');
        tableCreator.addHeader('a', 'NUMBER');
        tableCreator.addHeader('b', 'STRING');
        tableCreator.addHeader('c', 'DATE');
        tableCreator.setUnique('a', 'b', 'c');
        tableCreator.endCreateTable()
        .catch(err => expect(err).to.not.equal(Error));

        tableCreator.initCreateTable('abc');
        tableCreator.addHeader('a', 'NUMBER', 'PRIMARY KEY');
        tableCreator.addHeader('b', 'STRING', 'UNIQUE');
        tableCreator.addHeader('c', 'DATE');
        tableCreator.setUnique('a', 'b', 'c');
        tableCreator.endCreateTable()
        .catch(err => expect(err).to.not.equal(Error));
        done();
        isUsed = false;
      }
    });
  });
});
