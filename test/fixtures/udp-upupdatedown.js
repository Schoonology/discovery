var discovery = require('../../');
var registry = discovery.createRegistry({ id: 'udp-upupdatedown' });
var service = registry.createService('test', { foo: 'bar' });

setTimeout(function () {
  service.update({
    bar: 'foo'
  });
}, 100);

setTimeout(function () {
  service.available = false;
}, 200);

setTimeout(function () {
  registry.destroy();
}, 300);
