var path = require('path');
var fork = require('child_process').fork;

function forkServiceTest(name) {
  return fork(path.join(__dirname, name));
}

module.exports = {
  forkServiceTest: forkServiceTest
};
