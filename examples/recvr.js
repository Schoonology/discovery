'use strict';
var Discovery = require('../index.js').Discovery;
var discover = new Discovery();

discover.on('available', function(name, data, reason) {
  console.log(name,':','available:',reason);
  console.log(data);
});

discover.on('unavailable', function(name, data, reason) {
  console.log(name,':','unavailable:',reason);
  console.log(data);
});
