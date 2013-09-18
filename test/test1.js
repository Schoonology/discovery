'use strict';
var assert = require('assert');
var getDiscovery = require('../index.js').getDiscovery;
var discover = getDiscovery();

var serv = {
  name: 'test',
  port: 80,
  proto: 'tcp',
  addrFamily: 'IPv4',
  userData: {
    name: 'Edmond',
    day: 2233,
    week: [ 'monday', 'tuesday', 'wednesday', 'thursday', 'friday' ]
  }
};

var count = 0;

describe('Discover announce initial & time out events', function() {
  it('Should send a single initial event and then a time out', function(cb) {
    this.timeout(11000);
    discover.on('available', function(name, available, msg, reason) {
      console.log('available',reason);
      count++;
      if (count === 1)
        assert.ok(reason==='new');
      if (count === 2) {
        assert.ok(reason==='timedOut');
        cb();
      }
    });

    discover.announce(serv);

    setTimeout(function() {
      discover.stopAnnounce('test');
    }, 5000);
  });
});
