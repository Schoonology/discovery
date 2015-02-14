var discovery = require('../../');
var registry = discovery.createRegistry({ id: 'udp-updownup' });
var service = registry.createService('test', { foo: 'bar' });

setTimeout(function () {
  service.available = false;
}, 100);

setTimeout(function () {
  service.available = true;
}, 200);

setTimeout(function () {
  registry.destroy();
}, 300);
