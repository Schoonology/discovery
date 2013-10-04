'use strict';
var events = require('events');
var util = require('util');

/**
 * Creates a new instance of Manager with the provided `options`.
 *
 * This class provides the abstract interface for more specific Manager
 * implementations.
 *
 * See UdpBroadcastManager for a specific example, and the README for more
 * information about the design.
 *
 * @param {Object} options
 */
function Manager(options) {
  if (!(this instanceof Manager)) {
    return new Manager(options);
  }

  options = options || {};
}
util.inherits(Manager, events.EventEmitter);

/**
 * TODO: Description.
 */
Manager.prototype.destroy = destroy;
function destroy() {
  var self = this;

  return self;
}

/**
 * TODO: Description.
 */
Manager.prototype.generateId = generateId;
function generateId() {
  var self = this;
  var seed = Math.random().toString();

  return seed.slice(2, 6) + '-' + seed.slice(6, 10);
}

/**
 * TODO: Description.
 */
Manager.prototype.addLocalService = addLocalService;
function addLocalService(service) {
  throw new Error('Bad Manager: addLocalService unimplemented.');
}

/**
 * TODO: Description.
 */
Manager.prototype.removeLocalService = removeLocalService;
function removeLocalService(service) {
  throw new Error('Bad Manager: removeLocalService unimplemented.');
}

/**
 * TODO: Description.
 */
Manager.prototype.updateLocalService = updateLocalService;
function updateLocalService(service) {
  throw new Error('Bad Manager: updateLocalService unimplemented.');
}

/*!
 * Export `Manager`.
 */
module.exports = Manager;
