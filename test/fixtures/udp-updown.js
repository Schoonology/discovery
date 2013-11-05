var discovery = require('../../');
var registry = discovery.createRegistry({ id: 'udp-updown' });
var service = registry.createService('test', { foo: 'bar' });

setTimeout(function () {
  service.available = false;
}, 100);

setTimeout(function () {
  process.exit(0);
}, 200);
