var discovery = require('../../');
var registry = discovery.createRegistry({
  id: 'http-updown',
  manager: discovery.Http()
});
var service = registry.createService('test', { foo: 'bar' });

setTimeout(function () {
  service.available = false;
}, 100);

setTimeout(function () {
  registry.destroy();
}, 200);
