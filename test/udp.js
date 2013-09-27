var expect = require('chai').expect;
var common = require('./fixtures/common');
var discovery = require('../');

describe('UDP Broadcast', function () {
  var registry;
  var events;

  beforeEach(function () {
    registry = discovery.createRegistry();

    registry.on('available', function (name, service, reason) {
      expect(service.available).to.equal(true);
      events.push('available');
    });

    registry.on('unavailable', function (name, service, reason) {
      expect(service.available).to.equal(false);
      events.push('unavailable');
    });

    registry.on('update', function (name, service, reason) {
      events.push('update');
    });

    events = [];
  });

  afterEach(function () {
    if (registry) {
      registry.destroy();
    }
  });

  it('up-down', function (done) {
    registry.on('available', function (name, service, reason) {
      expect(name).to.equal('test:udp-updown');
      expect(service.name).to.equal('test:udp-updown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(reason).to.equal('new');
    });

    registry.on('unavailable', function (name, service, reason) {
      expect(name).to.equal('test:udp-updown');
      expect(service.name).to.equal('test:udp-updown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(reason).to.equal('availabilityChange');
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

  it('up-down-up', function (done) {
    registry.on('available', function (name, service, reason) {
      expect(name).to.equal('test:udp-updownup');
      expect(service.name).to.equal('test:udp-updownup');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(reason).to.equal('new');
    });

    registry.on('unavailable', function (name, service, reason) {
      expect(name).to.equal('test:udp-updownup');
      expect(service.name).to.equal('test:udp-updownup');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(reason).to.equal('availabilityChange');
    });

    common.forkServiceTest('udp-updownup')
      .on('exit', function (code) {
        expect(code).to.equal(0, 'Subprocess did not exit nicely.');

        expect(events).to.deep.equal([
          'available',
          'unavailable',
          'available'
        ]);

        done();
      });
  });

  it('up-update-down', function (done) {
    registry.on('available', function (name, service, reason) {
      expect(name).to.equal('test:udp-upupdatedown');
      expect(service.name).to.equal('test:udp-upupdatedown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.not.exist;
      expect(reason).to.equal('new');
    });

    registry.on('update', function (name, service, reason) {
      expect(name).to.equal('test:udp-upupdatedown');
      expect(service.name).to.equal('test:udp-upupdatedown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.equal('foo');
      expect(reason).to.equal('update');
    })

    registry.on('unavailable', function (name, service, reason) {
      expect(name).to.equal('test:udp-upupdatedown');
      expect(service.name).to.equal('test:udp-upupdatedown');
      expect(service.local).to.equal(false);
      expect(service.data.foo).to.equal('bar');
      expect(service.data.bar).to.equal('foo');
      expect(reason).to.equal('availabilityChange');
    });

    common.forkServiceTest('udp-upupdatedown')
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
