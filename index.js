var fs = require('fs')
  , path = require('path'),
  resolve = require('resolve');

var resolvePath = function(unresolvedPath) {
  var resolvedPath = unresolvedPath;
  var tempPath;
  var currentCwd = process.cwd();
  var testString = currentCwd + '/node_modules/';

  if (unresolvedPath.indexOf(testString) === 0) {
    tempPath = unresolvedPath.replace(testString, '');
    try {
      resolvedPath = resolve.sync(tempPath, {
        basedir: currentCwd
      });
    } catch (e) {}
  }
  return resolvedPath;
};

module.exports = function(options) {
  options = options || {import_paths: []};

  var import_paths
    , import_paths_len;

  return function(url, prev, done) {
    if (url.slice(0, 4) !== 'CSS:') {
      return done();
    }

    import_paths = options.import_paths.slice();
    if (fs.existsSync(prev)) {
      import_paths.unshift(path.dirname(prev));
    }
    import_paths_len = import_paths.length;

    if (import_paths_len === 0) {
      return done();
    }

    var css_path = url.slice(4) + '.css'
      , css_filepath, i = 0, import_path;

    for (; i < import_paths_len; ++i) {
      import_path = import_paths[i];
      css_filepath = resolvePath(path.join(import_path, css_path));
      if (fs.existsSync(css_filepath)) {
        return readPath(css_filepath, done);
      } else {
        css_filepath = resolvePath(path.join(import_path, url.slice(4)));
        if (fs.existsSync(css_filepath)) {
          return readPath(css_filepath, done);
        }
      }
    }
    return done(new Error('Specified CSS file not found! ("' + css_path + '" referenced from "' + prev + '")'));
  };
};

function readPath(css_filepath, done) {
  fs.readFile(css_filepath, function(err, data) {
    if (err) {
      return done(err);
    }
    done({contents: data.toString()});
  });
}
