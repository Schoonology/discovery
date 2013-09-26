var discovery = require('../../');
var registry = discovery.createRegistry({ id: 'udp-updown' });
var service = registry.createService({ name: 'test' });

setTimeout(function () {
  service.down();
  process.exit();
}, 100);
