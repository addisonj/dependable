const path      = require('path');
const assert    = require('assert');
const { container } = require('../index');

describe('File Names', () =>
  it('should load files with dashes in a sane way', function(done) {
    const deps = container();

    const dashedFileUser = function(roflCoptor) {
      assert.ok(roflCoptor);
      return done();
    };

    deps.load(path.join(__dirname, 'test-files'));
    deps.register('dashedFileUser', dashedFileUser);
    return deps.get('dashedFileUser');
  })
);
