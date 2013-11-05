'use strict';
var discovery = require('../..');
var registry = discovery.createRegistry({
  manager: discovery.Http({
    port: 4201
  })
});
var service = registry.createService('flaky', {
  interval: 'one second'
});

setInterval(flip, 1000);

function flip() {
  service.available = !service.available;
}
