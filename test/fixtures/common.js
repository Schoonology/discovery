var path = require('path');
var fork = require('child_process').fork;

function forkServiceTest(name) {
  return fork(path.join(__dirname, name));
}

function forkTracker() {
  var tracker = fork(
    path.join(__dirname, '..', '..', 'bin', 'tracker'),
    ['--timeout', 200]
  );

  tracker.on('message', function (message) {
    if (message === 'ready') {
      tracker.emit('ready');
    }
  });

  return tracker;
}

module.exports = {
  forkServiceTest: forkServiceTest,
  forkTracker: forkTracker
};
