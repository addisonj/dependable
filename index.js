const path = require('path');
const fs = require('fs');

const existsSync = fs.existsSync != null ? fs.existsSync : path.existsSync;

// simple dependency injection. No nesting, just pure simplicity
exports.container = function() {

  const factories = {};
  const modules = {};


  //# REGISTER / PARSE ################################################

  // register it! Parse it for dependencies
  const register = function(name, func) {
    if (name === Object(name)) {
      const hash = name;
      return (() => {
        const result = [];
        for (name in hash) {
          func = hash[name];
          result.push(registerOne(name, func));
        }
        return result;
      })();
    } else {
      return registerOne(name, func);
    }
  };

  var registerOne = function(name, func) {
    if ((func == null)) { throw new Error("cannot register null function"); }
    return factories[name] = toFactory(func);
  };

  const list = () => factories;

  const load = function(file) {
    const exists = existsSync(file);
    if (exists) {
      const stats = fs.statSync(file);
      if (stats.isDirectory()) { return loaddir(file); }
    }
    return loadfile(file);
  };

  var loadfile = function(file) {
    const module = file.replace(/\.\w+$/, "");

    // Remove dashes from files and camelcase results
    const name = path.basename(module).replace(/\-(\w)/g, (match, letter) => letter.toUpperCase());

    return modules[name] = module;
  };

  var loaddir = function(dir) {
    const filenames = fs.readdirSync(dir);
    const files = filenames.map(file => path.join(dir, file));
    return (() => {
      const result = [];
      for (let file of Array.from(files)) {
        let item;
        if (!file.match(/\.(js|coffee)$/)) { continue; }
        const stats = fs.statSync(file);
        if (stats.isFile()) { item = loadfile(file); }
        result.push(item);
      }
      return result;
    })();
  };

  var toFactory = function(func) {
    if (typeof func === "function") {
      return {
        func,
        required: argList(func)
      };
    } else {
      return {
        func() { return func; },
        required: []
      };
    }
  };

  const getArgs = function(func) {
    const funcString = func.toString()
    // normal function syntax
    let match = funcString.match(/function.*?\(([\s\S]*?)\)/);
    // fat arrow syntax with parens
    if (!match) match = funcString.match(/.*?\(([\s\S]*?)\).*?=>/);
    if (!match) match = funcString.match(/.*?([\S]+).*?=>/);
    if (match == null) { throw new Error(`could not parse function arguments: ${(func != null ? func.toString() : undefined)}`); }
    return match;
  };

  var argList = function(func) {
    // match over multiple lines
    const match = getArgs(func);
    const required = match[1].split(",").filter(notEmpty).map(str => str.trim());
    return required;
  };

  var notEmpty = a => a;

  //# GET ########################################################
  // gives you a single dependency

  // recursively resolve it!
  // TODO add visitation / detect require loops
  var get = function(name, overrides, visited) {

    if (visited == null) { visited = []; }
    const isOverridden = (overrides != null);

    // check for circular dependencies
    if (haveVisited(visited, name)) {
      throw new Error(`circular dependency with '${name}'`);
    }
    visited = visited.concat(name);

    let factory = factories[name];
    if ((factory == null)) {
      const module = modules[name];
      if (module != null) {
        register(name, require(module));
        factory = factories[name];
      } else {
        throw new Error(`dependency '${name}' was not registered`);
      }
    }

    // use the one you already created
    if ((factory.instance != null) && !isOverridden) {
      return factory.instance;
    }

    // apply args to the right?
    const dependencies = factory.required.map(function(name) {
      if ((overrides != null ? overrides[name] : undefined) != null) {
        return (overrides != null ? overrides[name] : undefined);
      } else {
        return get(name, overrides, visited);
      }
    });

    const instance = factory.func(...dependencies);

    if (!isOverridden) {
      factory.instance = instance;
    }

    return instance;
  };

  var haveVisited = function(visited, name) {
    const isName = n => n === name;
    return visited.filter(isName).length;
  };

  //# RESOLVE ##########################################################

  const resolve = function(overrides, func) {
    if (!func) {
      func = overrides;
      overrides = null;
    }
    register("__temp", func);
    return get("__temp", overrides);
  };

  const container = {
    get,
    resolve,
    register,
    load,
    list
  };

  // let people access the container if the know what they're doing
  container.register("_container", container);

  return container;
};
