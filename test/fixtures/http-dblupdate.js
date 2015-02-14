var discovery = require('../../');
var registry = discovery.createRegistry({
  id: 'http-dblupdate',
  manager: discovery.Http()
});
var service = registry.createService('test', { foo: 'bar' });

setTimeout(function () {
  service.update({
    bar: 'foo'
  });
}, 100);

setTimeout(function () {
  service.update({
    bar: 'foo'
  });
}, 200);

setTimeout(function () {
  service.available = false;
}, 300);

setTimeout(function () {
  registry.destroy();
}, 400);
