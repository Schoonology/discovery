'use strict';
var assert = require('assert');
var events = require('events');
var util = require('util');
var debug = require('./debug')('discovery:Registry');
var Manager = require('./manager');
var Service = require('./service');
var UdpBroadcast = require('./managers/broadcast');

/**
 * Creates a new instance of Registry with the provided `options`.
 *
 * The Registry is the cornerstone of Discovery. Each node in the cluster
 * is expected to have at least one Registry, with that Registry being
 * responsible for one or more local Services. Its Manager, in turn,
 * synchronizes the Registry's understanding of the cluster and its
 * remotely-available Services.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function Registry(options) {
  if (!(this instanceof Registry)) {
    return new Registry(options);
  }

  options = options || {};

  debug('New Registry: %j', options);

  this.manager = options.manager || new UdpBroadcast();
  this.services = {};

  this._initProperties(options);
  this._initManager();

  assert(this.manager instanceof Manager, 'Invalid Manager type.');
}
util.inherits(Registry, events.EventEmitter);
Registry.createRegistry = Registry;

/**
 * Signals a graceful shutdown of the Registry's and its Manager's internal
 * resources.
 *
 * @return {Registry} The Registry instance, for cascading.
 */
Registry.prototype.destroy = destroy;
function destroy() {
  var self = this;

  self.manager.destroy();

  return self;
}

/**
 * Creates a new, local Service object to represent the named service. This
 * Service will be synchronized via the Manager to all other Registry objects
 * in its network. That is, all other Registry objects whose Managers are both
 * compatible and reachable by this Registry's Manager will emit 'available'
 * events for this Service.
 *
 * @param  {String}  name        The name of the new Service. Names are read-only;
 *                               once the Service has been created, _this cannot be
 *                               changed._
 * @param  {Object}  [data]      Metadata to associate with this Service. Although
 *                               optional, this is recommended.
 * @param  {Boolean} [available] If `true`, this Service will immediately be
 *                               considered available for use.
 * @return {Service}             The newly-created Service object.
 */
Registry.prototype.createService = createService;
function createService(name, data, available) {
  var self = this;

  if (!name || typeof name !== 'string' || name === '__proto__') {
    console.trace('Valid name is required for createService.');
    return null;
  }

  if (!data) {
    // TODO(schoon) - Use `debug` instead?
    console.warn('No data passed to createService. This is usually accidental.');
  }

  if (available == null) {
    available = true;
  }

  // We start the Service as unavailable to let it trigger the first 'available'
  // event later, if appropriate.
  var service = new Service({
    // TODO(schoon) - Should this just take a name?
    id: self.getUniqueServiceId({ name: name }),
    name: name,
    data: data,
    available: false,
    local: true
  });

  // TODO(schoon) - Support multiple similar services on the same Registry or
  // throw if this would overwrite.
  self.services[service.id] = service;
  self._bindToServiceEvents(service);

  // If `available` is true, this will kick of the 'available' event.
  service.available = available;

  return service;
}

/**
 * @private
 *
 * Used by `getUniqueServiceId` to generate a unique identifier for
 * Services. Generally, access via the `id` property is recommended.
 *
 * @return {String} The new ID for this Registry.
 */
Registry.prototype.generateId = generateId;
function generateId() {
  var self = this;
  var salt = Math.random().toString().slice(2, 6);

  return self.manager.generateId() + ':' + salt;
}

/**
 * @private
 *
 * Returns a unique identifier for the given service.
 *
 * @param  {Service} service The service to identify.
 * @return {String}          The unique identifier.
 */
Registry.prototype.getUniqueServiceId = getUniqueServiceId;
function getUniqueServiceId(service) {
  var self = this;

  return service.name + ':' + self.id;
}

/**
 * @private
 *
 * Binds events on a local Service object to behaviour within the Registry.
 */
Registry.prototype._bindToServiceEvents = _bindToServiceEvents;
function _bindToServiceEvents(service) {
  var self = this;

  service.on('update', function (service) {
    self.manager.updateLocalService(service);
    self.emit('update', service.name, service);
  });
  service.on('available', function (service) {
    self.manager.addLocalService(service);
    self.emit('available', service.name, service);
  });
  service.on('unavailable', function (service) {
    self.manager.removeLocalService(service);
    self.emit('unavailable', service.name, service);
  });

  return self;
}

/**
 * @private
 *
 * Initializes special properties within the Registry: those with getters,
 * setters, those that are read-only, and the like.
 */
Registry.prototype._initProperties = _initProperties;
function _initProperties(options) {
  var self = this;
  var _id = options.id;

  Object.defineProperty(self, 'id', {
    get: function () {
      if (!_id) {
        _id = self.generateId();
        debug('Generated new Registry ID: %s', _id);
      }

      return _id;
    }
  });

  return self;
}

/**
 * @private
 *
 * Initializes the new Manager, binding related events to internal Registry
 * behaviour in order to keep the two synchronized.
 */
Registry.prototype._initManager = _initManager;
function _initManager() {
  var self = this;

  self.manager.on('update', function (id, service) {
    debug('Received "update" from Manager for "%s".', id);

    if (isLocal(id)) {
      debug('Local, ignoring.');
      return;
    }

    if (self.services[id].update(service.data)) {
      self.emit('update', self.services[id].name, self.services[id]);
    } else {
      debug('Data unchanged, ignoring.');
    }
  });
  self.manager.on('available', function (id, service) {
    debug('Received "available" from Manager for "%s".', id);

    if (isLocal(id)) {
      debug('Local, ignoring.');
      return;
    }

    if (self.services[id]) {
      if (self.services[id].available) {
        debug('Already considered available, ignoring.');
        return;
      }

      self.services[id].available = true;
    } else {
      self.services[id] = new Service(service);
    }

    self.emit('available', self.services[id].name, self.services[id]);
  });
  self.manager.on('unavailable', function (id, service) {
    debug('Received "unavailable" from Manager for "%s".', id);

    if (isLocal(id)) {
      debug('Local, ignoring.');
      return;
    }

    if (self.services[id]) {
      if (self.services[id].available) {
        self.services[id].available = false;
      } else {
        debug('Already considered unavailable, ignoring.');
        return;
      }
    } else {
      service.available = false;
      self.services[id] = new Service(service);
    }

    self.emit('unavailable', self.services[id].name, self.services[id]);
  });

  return self;

  function isLocal(id) {
    var service = self.services[id];
    return service && service.local;
  }
}

/*!
 * Export `Registry`.
 */
module.exports = Registry;
