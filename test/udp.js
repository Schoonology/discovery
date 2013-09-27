var expect = require('chai').expect;
var common = require('./fixtures/common');
var discovery = require('../');

describe('UDP Broadcast', function () {
  var registry;

  afterEach(function () {
    if (registry) {
      registry.destroy();
    }
  });

  it('up-down', function (done) {
    var events = [];

    registry = discovery.createRegistry();

    registry.on('available', function (name, service, reason) {
      expect(name).to.equal('test:udp-updown');
      expect(service.name).to.equal('test:udp-updown');
      expect(service.available).to.equal(true);
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(reason).to.equal('new');

      events.push('available');
    });

    registry.on('unavailable', function (name, service, reason) {
      expect(name).to.equal('test:udp-updown');
      expect(service.name).to.equal('test:udp-updown');
      expect(service.available).to.equal(false);
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(reason).to.equal('availabilityChange');

      events.push('unavailable');
    });

    common.forkServiceTest('udp-updown')
      .on('exit', function (code) {
        expect(code).to.equal(0, 'Subprocess did not exit nicely.');

        expect(events).to.deep.equal([
          'available',
          'unavailable'
        ]);

        done();
      });
  });
});
