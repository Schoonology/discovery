var path = require('path');
var fork = require('child_process').fork;

function forkServiceTest(name) {
  return fork(path.join(__dirname, name));
}

function forkTracker() {
  var tracker = fork(path.join(__dirname, '..', '..', 'bin', 'tracker'));

  setTimeout(function () {
    tracker.emit('ready');
  }, 100);

  return tracker;
}

module.exports = {
  forkServiceTest: forkServiceTest,
  forkTracker: forkTracker
};
