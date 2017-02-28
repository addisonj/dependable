
const {container} = require('../index');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

describe('inject', function() {
  it('should create a container', function() {
    let deps;
    return deps = container();
  });

  it('should return module without deps', function() {
    const Abc = () => "abc";
    const deps = container();
    deps.register("abc", Abc);
    return assert.equal(deps.get("abc"), "abc");
  });

  it('should get a single dependency', function() {
    const Stuff = names => names[0];
    const Names = () => ["one", "two"];
    const deps = container();
    deps.register("stuff", Stuff);
    deps.register("names", Names);
    return assert.equal(deps.get("stuff"), "one");
  });

  it('should resovle multiple dependencies', function() {
    const post = function(Comments, Users) {
      let Post;
      return Post = class Post {
        constructor(comments1, author) {
          this.comments = comments1;
          this.author = author;
        }
        authorName() { return Users.getName(this.author); }
        firstCommentText() { return Comments.getText(this.comments[0]); }
      };
    };

    const comments = () => ({getText(obj) { return obj.text; }});
    const users = () => ({getName(obj) { return obj.name; }});

    const deps = container();
    deps.register("Post", post);
    deps.register("Users", users);
    deps.register("Comments", comments);

    const PostClass = deps.get("Post");

    const apost = new PostClass([{text: "woot"}], {name: "bob"});
    assert.equal(apost.authorName(), "bob");
    return assert.equal(apost.firstCommentText(), "woot");
  });

  it('should let me use different databases for different collections (pass in info)', function() {
    const db = data =>
      ({
        data,
        get(key) { return this.data[key]; },
        set(key, value) { return this.data[key] = value; }
      })
    ;

    const name = () => "bob";

    const people = (name, db) =>
      ({
        name,
        add(person) { return db.set(person.name, person); },
        find(name) { return db.get(name); }
      })
    ;

    const places = (name, db) =>
      ({
        name,
        add(place) { return db.set(place.name, place); },
        find(name) { return db.get(name); }
      })
    ;

    const deps = container();
    deps.register("name", name);
    deps.register("people", people);
    deps.register("places", places);

    const peopleDb = db({});
    const placesDb = db({});

    const peoplez = deps.get("people", {db: peopleDb});
    const placez = deps.get("places", {db: placesDb});

    assert.equal(peoplez.name, "bob");
    assert.equal(placez.name, "bob");

    peoplez.add({name: "one"});
    placez.add({name: "two"});

    assert.ok(peoplez.find("one"));
    assert.ok(!placez.find("one"));

    assert.ok(placez.find("two"));
    return assert.ok(!peoplez.find("two"));
  });

  it('should get nested dependencies', function() {
    const gpa = () => ({age: 86});
    const dad = gpa => ({age: gpa.age - 20});
    const son = dad => ({age: dad.age - 20});

    const deps = container();
    deps.register("gpa", gpa);
    deps.register("dad", dad);
    deps.register("son", son);

    const ason = deps.get("son");
    return assert.equal(ason.age, 46);
  });

  it('should throw error on circular dependency', function() {
    let err;
    const one = two => two + 1;
    const two = one => one + 2;

    const deps = container();
    deps.register("one", one);
    deps.register("two", two);

    try {
      const aone = deps.get("one");
    } catch (e) {
      err = e;
    }

    return assert.ok(err.toString().match('circular dependency'));
  });

  it("should NOT throw circular dependency error if two modules require the same thing", function() {
    const deps = container();
    deps.register("name", () => "bob");
    deps.register("one", name => name + " one");
    deps.register("two", name => name + " two");
    deps.register("all", (one, two) => one.name + " " + two.name);

    try {
      let all;
      return all = deps.get("all");
    } catch (e) {
      return assert.ok(false, "should not have thrown error");
    }
  });

  it("should list dependencies registered", function() {
    const deps = container();
    deps.register("one", name => name + " one");
    deps.register("two", name => name + " two");

    const list = deps.list();
    assert.equal(list.one.func("1"), "1 one");
    return assert.equal(list.two.func("2"), "2 two");
  });

  it("should throw error if it cant find dependency", function() {
    let err;
    const deps = container();

    try {
      deps.get("one");
    } catch (e) {
      err = e;
    }

    return assert.ok(err);
  });

  it("should throw error if it cant find dependency of dependency", function() {
    let err;
    const deps = container();
    deps.register("one", two => "one");
    try {
      deps.get("one");
    } catch (e) {
      err = e;
    }
    return assert.ok(err);
  });

  it('should let you get multiple dependencies at once, injector style', function(done) {
    const deps = container();
    deps.register("name", () => "bob");
    deps.register("one", name => name + " one");
    deps.register("two", name => name + " two");
    return deps.resolve(function(one, two) {
      assert.ok(one);
      assert.ok(two);
      assert.equal(one, "bob one");
      assert.equal(two, "bob two");
      return done();
    });
  });

  it('should return the SAME instance to everyone', function() {
    const deps = container();
    deps.register("asdf", () => ({woot: "hi"}));
    deps.register("a", asdf => asdf.a = "a");
    deps.register("b", asdf => asdf.b = "b");
    const asdf = deps.get("asdf");
    const a = deps.get('a');
    const b = deps.get('b');
    assert.equal(asdf.a, "a");
    return assert.equal(asdf.b, "b");
  });

  it('should inject the container (_container)', function() {
    const deps = container();
    return assert.equal(deps.get('_container'), deps);
  });

  describe('cache', () =>
    it('should re-use the same instance', function() {
      const deps = container();
      deps.register("a", () => ({one: "one"}));
      const a = deps.get("a");
      assert.deepEqual(a, {one: "one"});
      assert.notEqual(a, {one: "one"});
      const a2 = deps.get("a");
      return assert.equal(a, a2);
    })
  );

  describe('overrides', function() {
    it('should override a dependency', function() {
      const deps = container();
      deps.register("a", b => ({value: b}));
      deps.register("b", "b");
      const a = deps.get("a", {b: "henry"});
      return assert.equal(a.value, "henry");
    });

    it('should not cache when you override', function() {
      const deps = container();
      deps.register("a", b => ({value: b}));
      deps.register("b", "b");

      const overridenA = deps.get("a", {b: "henry"});
      const a = deps.get("a");
      assert.notEqual(a.value, "henry", 'it cached the override value');
      return assert.equal(a.value, "b");
    });

    it('should ignore the cache when you override', function() {
      const deps = container();
      deps.register("a", b => ({value: b}));
      deps.register("b", "b");

      const a = deps.get("a");
      const overridenA = deps.get("a", {b: "henry"});
      assert.notEqual(overridenA.value, "b", 'it used the cached value');
      return assert.equal(overridenA.value, "henry");
    });

    return it('should override on resolve', function(done) {
      const deps = container();
      deps.register("a", b => ({value: b}));
      deps.register("b", "b");
      return deps.resolve({b: "bob"}, function(a) {
        assert.equal(a.value, "bob");
        return done();
      });
    });
  });


  describe('file helpers', function() {
    it('should let you register a file', function(done) {
      const afile = path.join(os.tmpDir(), "A.js");
      const acode = `\
module.exports = function() { return 'a' }\
`;

      const bfile = path.join(os.tmpDir(), "B.js");
      const bcode = `\
module.exports = function(A) { return A + 'b' }\
`;
      return fs.writeFile(afile, acode, function(err) {
        assert.ifError((err));
        const deps = container();
        deps.load(afile);
        const a = deps.get('A');
        assert.equal(a, 'a');

        return fs.writeFile(bfile, bcode, function(err) {
          assert.ifError((err));
          deps.load(bfile);
          const b = deps.get('B');
          assert.equal(b, 'ab');
          return done();
        });
      });
    });

    it('should let you register a whole directory', function(done) {

      const dir = path.join(os.tmpDir(), "testinject");

      const afile = path.join(dir, "A.js");
      const acode = `\
module.exports = function() { return 'a' }\
`;

      const bfile = path.join(dir, "B.js");
      const bcode = `\
module.exports = function(A) { return A + 'b' }\
`;

      return fs.mkdir(dir, err =>
        // ignore err, if it already exists
        fs.writeFile(afile, acode, function(err) {
          assert.ifError((err));
          return fs.writeFile(bfile, bcode, function(err) {
            assert.ifError((err));

            const deps = container();
            deps.load(dir);
            const b = deps.get('B');
            assert.equal(b, 'ab');
            return done();
          });
        })
      );
    });

    it('should let you load a file without an extension');
    it('should load a folder with a file with parse errors without accidentally trying to load the folder as a file');
    it('should not crash if trying to load something as a file without an extension (crashed on fs.stat)');
    return it('should be lazy', function(done) {

      const dir = path.join(os.tmpDir(), "testinject");

      const cfile = path.join(dir, "C.js");
      const ccode = `\
throw new Error('Should not be loaded because we do not require it');\
`;

      const dfile = path.join(dir, "D.js");
      const dcode = `\
module.exports = function() { return 'd'; };\
`;

      return fs.mkdir(dir, err =>
        // ignore err, if it already exists
        fs.writeFile(cfile, ccode, function(err) {
          assert.ifError((err));
          return fs.writeFile(dfile, dcode, function(err) {
            assert.ifError((err));

            const deps = container();
            deps.load(dir);
            assert.equal('d', deps.get('D'));
            return done();
          });
        })
      );
    });
  });

  describe('simple dependencies', () =>
    it('doesnt have to be a function. objects work too', function() {
      const deps = container();
      deps.register("a", "a");
      return assert.equal(deps.get("a"), "a");
    })
  );

  describe('registering a hash', () =>
    it('should register a hash of key : dep pairs', function() {
      const deps = container();
      deps.register({
        a: "a",
        b: "b"
      });
      assert.equal(deps.get("a"), "a");
      return assert.equal(deps.get("b"), "b");
    })
  );

  describe('nested containers', () => it('should inherit deps from the parent'));

  return describe('maybe', function() {
    it('should support objects/data instead of functions?');
    return it('should support optional dependencies?');
  });
});
