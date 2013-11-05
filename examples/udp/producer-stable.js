'use strict';
var discovery = require('../..');
var registry = discovery.createRegistry();
var service = registry.createService('stable', {
  uptime: 0.99
});

setInterval(check, 10);

function check() {
  service.available = Math.random() < 0.99;
}
