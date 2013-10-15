'use strict';
var discovery = require('../..');
var registry = discovery.createRegistry({
  manager: discovery.Http({
    port: 4201
  })
});
var service = registry.createService('stable', {
  uptime: 0.99
});

setInterval(check, 10);

function check() {
  service.available = Math.random() < 0.99;
}
