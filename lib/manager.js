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

  this.services = {};
}
util.inherits(Manager, events.EventEmitter);

/**
 * Signals a graceful shutdown of the Manager's internal resources.
 *
 * @return {Manager} The Manager instance, for cascading.
 */
Manager.prototype.destroy = destroy;
function destroy() {
  return this;
}

/**
 * Returns a Manager-specific unique identifier.
 *
 * See Registry.generateId for more information.
 *
 * @return {String} The indentifier.
 */
Manager.prototype.generateId = generateId;
function generateId() {
  var seed = Math.random().toString();

  return seed.slice(2, 6) + '-' + seed.slice(6, 10);
}

/**
 * Used as a signal from the Registry to its Manager that a new local Service
 * is available.
 *
 * @param  {Service} service The new, available Service object.
 * @return {Manager}         The Manager instance, for cascading.
 */
Manager.prototype.addLocalService = addLocalService;
function addLocalService(service) {
  this.services[service.id] = service;

  return this;
}

/**
 * Used as a signal from the Registry to its Manager that a local Service
 * is no longer available.
 *
 * @param  {Service} service The unavailable Service object.
 * @return {Manager}         The Manager instance, for cascading.
 */
Manager.prototype.removeLocalService = removeLocalService;
function removeLocalService(service) {
  return this;
}

/**
 * Used as a signal from the Registry to its Manager that a local Service
 * has updated its data without updating its availability.
 *
 * @param  {Service} service The updated Service object.
 * @return {Manager}         The Manager instance, for cascading.
 */
Manager.prototype.updateLocalService = updateLocalService;
function updateLocalService(service) {
  return this;
}

/**
 * Returns a JSON representation of the Manager suitable for logging debug
 * information.
 */
Manager.prototype.toJSON = toJSON;
function toJSON() {
  return {
    _name: this.constructor.name
  };
}

/*!
 * Export `Manager`.
 */
module.exports = Manager;
