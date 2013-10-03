var assert = require('assert');
var cluster = require('cluster');
var debug = require('../lib/debug')('discovery:Test');
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

    checkContinuity();
  });

  return;

  function checkContinuity() {
    var i = 0, len = updates.length;
    var missing = [];

    for (; i < len; i++) {
      if (!updates[i]) {
        missing.push(i);
      }
    }

    if (missing.length) {
      console.log('Missing %s: %s', missing.length, missing);
    }
  }
}

function worker() {
  var service;

  service = registry.createService('worker' + process.pid, { updates: 0 });

  setInterval(function () {
    if (Math.random() < 0.5) {
      debug('Flipping availability.');
      service.available = !service.available;
    } else {
      debug('Updating.');
      service.update({
        updates: service.data.updates + 1
      });
    }
  }, 10);
}

if (cluster.isMaster) {
  master();

  cluster.fork();
} else {
  worker();
}
