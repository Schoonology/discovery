var path = require('path');
var expect = require('chai').expect;
var nexpect = require('nexpect');
var discovery = require('../');

function startTestScript(name) {
  return nexpect.spawn('node', [path.join(__dirname, 'fixtures', name)]);
}

describe('Discovery', function () {
  describe('Registry', function () {
    it('should provide defaults', function () {
      discovery.createRegistry();
    });

    it('should resolve service names', function () {
      var registry = discovery.createRegistry();
      var fullName = registry.getFullServiceName({ name: 'test' });

      expect(fullName.slice(0, 5)).to.equal('test:');
      expect(fullName.slice(5)).to.equal(registry.id);
    });
  });

  describe('Service', function () {
    describe('name', function () {
      it('should be required', function () {
        expect(function () {
          new discovery.Service();
        }).to.throw('Name is required.');
      });

      it('should be read-only', function () {
        var service = new discovery.Service({ name: 'test' });

        expect(service.name).to.equal('test');
        service.name = 'changed';
        expect(service.name).to.equal('test');
      });
    });

    describe('local', function () {
      it('should default to false', function () {
        var service = new discovery.Service({ name: 'test' });
        expect(service.local).to.equal(false);
      });

      it('should be read-only', function () {
        var service = new discovery.Service({ name: 'test' });

        expect(service.local).to.equal(false);
        service.local = true;
        expect(service.local).to.equal(false);
      });
    });

    describe('available', function () {
      it('should be writable', function () {
        var service = new discovery.Service({
          name: 'test',
          available: true
        });

        expect(service.available).to.equal(true);
        service.available = false;
        expect(service.available).to.equal(false);
      });

      it('should emit available when updated to true', function () {
        var emitted = false;
        var service = new discovery.Service({
          name: 'test',
          available: false
        });

        service.on('available', function () {
          emitted = true;
        });

        service.available = true;
        expect(emitted).to.equal(true);
      });

      it('should emit unavailable when updated to false', function () {
        var emitted = false;
        var service = new discovery.Service({
          name: 'test',
          available: true
        });

        service.on('unavailable', function () {
          emitted = true;
        });

        service.available = false;
        expect(emitted).to.equal(true);
      });

      it('should be silent when not updated', function () {
        var emitted = false;
        var service = new discovery.Service({
          name: 'test',
          available: false
        });

        service.on('available', function () {
          emitted = true;
        });

        service.available = false;
        expect(emitted).to.equal(false);
      });
    });

    describe('update', function () {
      it('should update data accordingly', function () {
        var service = new discovery.Service({
          name: 'test',
          data: {
            foo: 'bar'
          }
        });

        expect(service.data.foo).to.equal('bar');
        service.update({ foo: 'blarg' });
        expect(service.data.foo).to.equal('blarg');
      });

      it('should add new data', function () {
        var service = new discovery.Service({
          name: 'test',
          data: {
            foo: 'bar'
          }
        });

        expect(service.data.foo).to.equal('bar');
        service.update({ bar: 'foo' });
        expect(service.data.foo).to.equal('bar');
        expect(service.data.bar).to.equal('foo');
      });

      it('should emit update when called', function () {
        var emitted = false;
        var service = new discovery.Service({
          name: 'test'
        });

        service.on('update', function () {
          emitted = true;
        });

        service.update({ foo: 'bar' });
        expect(emitted).to.equal(true);
      });
    });
  });

  describe('UDP Broadcast', function () {
    it('up-down', function (done) {
      startTestScript('udp-updown')
        .wait('Started.')
        .wait('Stopped.')
        .run(done);
    });
  });
});
