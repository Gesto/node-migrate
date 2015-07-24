
/*!
 * migrate
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var Set = require('./set')
  , path = require('path')
  , fs = require('fs')
  , isGenerator = require('is-generator').fn
  , co = require('co');

require('babel/register')({
  blacklist: [
    'regenerator',
    'es6.templateLiterals',
    'es6.classes',
    'es6.forOf'
  ]
});

/**
 * Expose the migrate function.
 */

exports = module.exports = migrate;

function migrate(title, up, down) {
  // migration
  if ('string' == typeof title && up && down) {
    migrate.set.addMigration(title, up, down);
  // specify migration file
  } else if ('string' == typeof title) {
    migrate.set = new Set(title);
  // no migration path
  } else if (!migrate.set) {
    throw new Error('must invoke migrate(path) before running migrations');
  // run migrations
  } else {
    return migrate.set;
  }
}

function wrap(fn) {
  if (isGenerator(fn))
    return function(next, common) { co(fn, common).then(next).catch(next); };
  else
    return fn;
}

exports.load = function (stateFile, migrationsDirectory) {

  var dir = path.resolve(migrationsDirectory);

  var common;
  try {
    common = require(path.join(dir, 'common'));
  } catch (err) { }

  var set = new Set(stateFile, common);

  fs.readdirSync(dir).filter(function(file){
    return file.match(/^\d+.*\.js$/);
  }).sort().forEach(function (file) {
    var mod = require(path.join(dir, file));
    set.addMigration(file, wrap(mod.up), wrap(mod.down));
  });

  return set;
};
