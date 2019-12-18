require('fake-indexeddb/auto');

const test = require('tape');
const suite = require('abstract-leveldown/test');
const LocalforageDOWN = require('..');

suite({
  test,
  factory() {
    return new LocalforageDOWN('test');
  },
  snapshots: false,
  bufferKeys: false,
  seek: false,
  createIfMissing: false,
  errorifExists: false
});
