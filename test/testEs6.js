container = require('../index').container();
assert = require('assert');

describe('resolve es6', function () {
  container.register('foo', {});
  container.register('bar', 'hurp');
  container.register('baz', 1);

  it('correct handles es6 fat arrow functions', function (done) {
    container.resolve((foo, bar, baz) => {
      assert.deepEqual(foo, {});
      assert.equal(bar, 'hurp');
      assert.equal(baz, 1);
      done();
    });
  });
  it('correct handles es6 fat arrow functions with whitespace', function (done) {
    container.resolve((foo, bar,
                       baz) => {
      assert.deepEqual(foo, {});
      assert.equal(bar, 'hurp');
      assert.equal(baz, 1);
      done();
    });
  });
  it('correct handles es6 fat arrow functions with no spaces between arrow', function (done) {
    container.resolve( (foo,bar,baz)=>{
      assert.deepEqual(foo, {});
      assert.equal(bar, 'hurp');
      assert.equal(baz, 1);
      done();
    });
  });
  it('correct handles es6 fat arrow with a single arg and spaces', function (done) {
    container.resolve( foo => {
      assert.deepEqual(foo, {});
      done();
    });
  });
  it('correct handles es6 fat arrow with a single arg and no spaces', function (done) {
    container.resolve(foo=>{
      assert.deepEqual(foo, {});
      done();
    });
  });
});
