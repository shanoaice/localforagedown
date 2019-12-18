const { AbstractLevelDOWN, AbstractIterator } = require('abstract-leveldown');
const localforage = require('localforage');
const supports = require('level-supports');

let iteratorPosition = -1;
let iteratorKeys;

class LocalforageDOWN extends AbstractLevelDOWN {
  constructor(location) {
    super(
      supports({
        bufferKeys: false,
        snapshots: false,
        permanence: true,
        clear: false,
        status: false,
        openCallback: false,
        createIfMissing: false,
        errorIfExists: false,
        deferredOpen: true,
        promises: true,
        streams: false,
        encodings: false
      })
    );
    this._store = localforage.createInstance({
      name: location,
      storeName: location
    });
  }

  _open(_) {
    Promise.resolve().then(arguments[arguments.length - 1]);
  }

  _close(_) {
    Promise.resolve().then(arguments[arguments.length - 1]);
  }

  _get(key, _) {
    if (typeof arguments[arguments.length - 1] === 'function') {
      this._store.getItem(key, arguments[arguments.length - 1]);
      return;
    }

    return this._store.getItem(key);
  }

  _put(key, value, _) {
    if (typeof arguments[arguments.length - 1] === 'function') {
      this._store.setItem(key, value, arguments[arguments.length - 1]);
      return;
    }

    return this._store.setItem(key, value);
  }

  _del(key, _) {
    if (typeof arguments[arguments.length - 1] === 'function') {
      this._store.removeItem(key, arguments[arguments.length - 1]);
      return;
    }

    return this._store.getItem(key);
  }

  _batch(operations, _) {
    if (typeof arguments[arguments.length - 1] === 'function') {
      const result = operations.every(val => {
        let success = true;
        switch (val.type) {
          case 'put':
            this._put(val.key, val.value, e => {
              if (e) {
                Promise.resolve().then(() => {
                  arguments[arguments.length - 1](e);
                });
                success = false;
              }
            });
            break;
          case 'delete':
            this._del(val.key, e => {
              if (e) {
                Promise.resolve().then(() => {
                  arguments[arguments.length - 1](e);
                });
                success = false;
              }
            });
            break;
          default:
            Promise.resolve().then(() => {
              arguments[arguments.length - 1](
                new Error('Unsupported batch action')
              );
            });
            success = false;
        }

        return success;
      });
      if (result) {
        Promise.resolve().then(arguments[arguments.length - 1]);
      }

      return;
    }

    return (async function() {
      operations.forEach(val => {
        switch (val.type) {
          case 'put':
            this._put(val.key, val.value, e => {
              if (e) {
                throw e;
              }
            });
            break;
          case 'delete':
            this._del(val.key, e => {
              if (e) {
                throw e;
              }
            });
            break;
          default:
            throw new Error('Unsupported batch action');
        }
      });
    })();
  }
}

class LocalforageDOWNIterator extends AbstractIterator {
  _next(callback) {
    if (!iteratorKeys) {
      this.db._store.keys(keys => {
        iteratorKeys = keys;
      });
    }

    iteratorPosition++;

    if (iteratorKeys[iteratorPosition] === undefined) {
      Promise.resolve().then(() => {
        callback(new Error('Already the last entry'));
      });
      return;
    }

    let value;
    this.db._get(iteratorKeys[iteratorPosition], val => {
      value = val;
    });
    Promise.resolve().then(() => {
      callback(null, iteratorKeys[iteratorPosition], value);
    });
  }

  _end(callback) {
    iteratorPosition = -1;
    iteratorKeys = undefined;
    Promise.resolve().then(callback);
  }
}

LocalforageDOWN.prototype._iterator = function(_) {
  return new LocalforageDOWNIterator(this);
};

module.exports = LocalforageDOWN;
