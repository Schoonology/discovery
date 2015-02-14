'use strict';
var assert = require('assert');
var events = require('events');
var util = require('util');
var clone = require('clone');
var debug = require('./debug')('discovery:Service');
var sigmund = require('sigmund');

/**
 * Creates a new instance of Service with the provided `options`.
 *
 * A Service is a simple wrapper around its `data` to ease managing the
 * Service's representation within its Registry and the announcements thereof.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function Service(options) {
  if (!(this instanceof Service)) {
    return new Service(options);
  }

  options = options || {};

  debug('New Service: %j', options);

  // There's no reasonable way to protect this, so we let it be writable with
  // the understanding that .update is called in the future. TL;DR - Write at
  // your own risk.
  this.data = clone(options.data || {});
  this._dataHash = sigmund(this.data);

  this._initProperties(options);

  assert(this.name, 'Name is required.');
}
util.inherits(Service, events.EventEmitter);

/**
 * Merges `data` with the Service's existing `data` property. Returns `true` if
 * the update was required (i.e. something was different), `false` otherwise
 * (e.g. `data` remains unchanged).
 *
 * @param  {Object}  data The new data to merge in.
 * @return {Boolean}      `true` if the Service's `data` property was updated.
 */
Service.prototype.update = update;
function update(data) {
  var self = this;
  var dataHash = sigmund(data);

  if (self._dataHash === dataHash) {
    return false;
  }

  util._extend(self.data, data);

  dataHash = sigmund(self.data);
  if (self._dataHash === dataHash) {
    return false;
  }

  self._dataHash = dataHash;

  debug('Data changed to %j', self.data);

  self.emit('update', self);

  return true;
}

/**
 * @private
 *
 * Emits an event on behalf of the Service, guaranteeing the Service object
 * itself is provided as additional context.
 */
Service.prototype.emit = emit;
function emit(event) {
  var self = this;

  if (!self.local) {
    return false;
  }

  debug('Broadcasting "%s".', event);

  return events.EventEmitter.prototype.emit.call(self, event, self);
}

/**
 * @private
 *
 * Initializes special properties within the Service: those with getters,
 * setters, those that are read-only, and the like.
 */
Service.prototype._initProperties = _initProperties;
function _initProperties(options) {
  var self = this;
  var _available = options.available || false;

  Object.defineProperty(self, 'id', {
    value: options.id || options.name
  });
  Object.defineProperty(self, 'name', {
    value: options.name
  });
  Object.defineProperty(self, 'local', {
    value: options.local || false
  });
  Object.defineProperty(self, 'available', {
    get: function () {
      return _available;
    },
    set: function (value) {
      value = !!value;

      if (_available === value) {
        return;
      }

      _available = value;

      debug('Service availability changed to %s.', value);

      self.emit(_available ? 'available' : 'unavailable', self);
    }
  });

  // Routing info for this Service, containing the same information as core
  // sockets/dgrams: `address`, `family`, and `port`.
  Object.defineProperty(self, 'rinfo', {
    value: options.rinfo || null
  });

  return self;
}

/**
 * Returns a JSON representation of the Service, omitting process-local
 * details that are inappropriate within other processes, e.g. `local`.
 */
Service.prototype.toJSON = toJSON;
function toJSON() {
  var self = this;

  return {
    id: self.id,
    name: self.name,
    data: self.data,
    available: self.available
  };
}

/*!
 * Export `Service`.
 */
module.exports = Service;
