var discovery = require('../../');
var registry = discovery.createRegistry({ id: 'udp-multi' });
var service = registry.createService('test', { foo: 'bar' });

setTimeout(function () {
  service.available = false;
}, 100);

setTimeout(function () {
  service.available = true;
}, 200);

setTimeout(function () {
  service.update({
    bar: 'foo'
  });
}, 300);

setTimeout(function () {
  service.available = false;
}, 400);

setTimeout(function () {
  process.exit(0);
}, 500);
