var path = require('path');
var fork = require('child_process').fork;
var expect = require('chai').expect;
var obcheckt = require('obcheckt');

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

  process.on('exit', function () {
    tracker.kill();
  });

  return tracker;
}

function expectEvent(obj, event, spec) {
  obj.once(event, function (name, service) {
    expect(name).to.equal(spec.name);
    obcheckt.validate(service, spec);
  });
}

function createRemoteServiceSpec(name, data) {
  return {
    name: name,
    id: String,
    local: false,
    rinfo: {
      address: String,
      family: String,
      port: Number
    },
    data: data || Object
  };
}

module.exports = {
  forkServiceTest: forkServiceTest,
  forkTracker: forkTracker,
  expectEvent: expectEvent,
  createRemoteServiceSpec: createRemoteServiceSpec
};
