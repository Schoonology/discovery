var debug = require('debug');

module.exports = function (name) {
  return debug(name + ':' + process.pid);
};
