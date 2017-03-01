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
  it('correctly handles nested es6 fat arrow', function (done) {
    function fakeCb(something) {
      something('beep')
    }
    container.resolve((foo) => {
      assert.deepEqual(foo, {});
      fakeCb((blah) => {
        done();
      })
    });
  });
  it('correctly handles nested es6 with nornal function', function (done) {
    function fakeCb(something) {
      something('beep')
    }
    container.resolve((foo) => {
      assert.deepEqual(foo, {});
      fakeCb(function (blah) {
        done();
      })
    });
  });
  it('correctly handles single line es6 function', function (done) {
    container.resolve((foo) => done())
  });
  it('correctly handles single line es6 function with no parens', function (done) {
    let cov_1whz2gwhsa = {
      f: [0]
    }
    function fakeCb(something) {
      something('beep')
    }
    container.resolve(foo=>{fakeCb(bar=>{++cov_1whz2gwhsa.f[0];let b = "what"; done()})})
  });


});
