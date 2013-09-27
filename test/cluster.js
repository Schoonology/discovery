var assert = require('assert');
var cluster = require('cluster');
var discovery = require('../');
var registry = discovery.createRegistry();

function master() {
  var updates = {};
  var total = 0;

  registry.on('available', function (name) {
    console.log('Available: %s', name);
  });

  registry.on('unavailable', function (name) {
    console.log('Unavailable: %s', name);
  });

  registry.on('update', function (name, service) {
    console.log('Update: %s %s', name, service.data.updates);

    var lastUpdate = updates[name] || 0;
    updates[name] = service.data.updates;

    total++;

    assert(lastUpdate === updates[name] - 1, 'Missed ' + (updates[name] - lastUpdate) + ' updates from ' + name);
  });
}

function worker() {
  var service;

  setTimeout(function () {
    service = registry.createService('worker' + process.pid, { updates: 0 });
  }, 50);

  setInterval(function () {
    if (Math.random() < 0.5) {
      service.available = !service.available;
    } else {
      service.update({
        updates: service.data.updates + 1
      });
    }
  }, 1000);
}

if (cluster.isMaster) {
  master();

  cluster.fork(1);
} else {
  worker();
}
