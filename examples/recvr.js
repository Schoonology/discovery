'use strict';
var Discovery = require('../index.js').Discovery;
var discover = new Discovery();

discover.on('available', function(name, data, reason) {
  console.log('available ',name);
  console.log('data',data);
  console.log('reason',reason);
  var obj = {a: 1, b: '2', c: true, d: {e: 333}};
  discover.sendEvent('Hello', obj);

  console.log(name,':','available:',reason);
  console.log(data);
});

discover.on('unavailable', function(name, data, reason) {
  console.log(name,':','unavailable:',reason);
  console.log(data);
});
