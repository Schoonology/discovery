'use strict';
/*!
 * TODO: Description.
 */
var dgram = require('dgram');
var util = require('util');
var debug = require('../debug')('discovery:UdpBroadcast');
var ip = require('ip');
var Manager = require('../manager');

var Defaults = {
  DGRAM_TYPE: 'udp4',
  PORT: 44201,
  INTERVAL: 3000,
  MULTICAST_ADDRESS: '224.0.0.234'
};

/**
 * Creates a new instance of UdpBroadcastManager with the provided `options`.
 *
 * The UdpBroadcastManager provides a client connection to the
 * zero-configuration, UDP-based discovery system that is used by SuperCluster
 * by default. Because it requires zero configuration to use, it's ideal for
 * initial exploration and development. However, it's not expected to work
 * at-scale, and should be replaced with the included HTTP-based version.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function UdpBroadcastManager(options) {
  if (!(this instanceof UdpBroadcastManager)) {
    return new UdpBroadcastManager(options);
  }

  options = options || {};

  Manager.call(this, options);

  debug('New UdpBroadcastManager: %j', options);

  this.dgramType = options.dgramType ? String(options.dgramType).toLowerCase() : Defaults.DGRAM_TYPE;
  this.port = options.port || Defaults.PORT;
  this.address = options.address || null;
  this.multicastAddress = options.multicastAddress || Defaults.MULTICAST_ADDRESS;

  this.interval = options.interval || Defaults.INTERVAL;
  this.timeout = options.timeout || this.interval * 2.5;

  this._timeoutTimerIds = {};
  this._annouceTimerId = null;

  this._initSocket();
  this._startAnnouncements();
}
util.inherits(UdpBroadcastManager, Manager);
UdpBroadcastManager.Defaults = Defaults;

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype.destroy = destroy;
function destroy() {
  var self = this;

  self._stopAnnouncements();
  self.socket.close();

  Object.keys(self._timeoutTimerIds)
    .forEach(function (key) {
      clearTimeout(self._timeoutTimerIds[key]);
    });

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype.generateId = generateId;
function generateId() {
  var self = this;

  return ip.address() + ':' + self.port;
}

/**
 * For each of these methods, we want to replicate what Manager does, but send
 * and extra announcement.
 */
['addLocalService', 'removeLocalService', 'updateLocalService']
  .forEach(function (name) {
    UdpBroadcastManager.prototype[name] = function (service) {
      Manager.prototype.addLocalService.call(this, service);
      this._sendAnnouncement();
      return this;
    };
  });

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype._initSocket = _initSocket;
function _initSocket() {
  var self = this;

  self.socket = dgram.createSocket(self.dgramType);
  self.socket.bind(self.port, self.address);

  self.socket.on('listening', function () {
    debug('Adding UDP multicast membership at `%s`.', self.multicastAddress);

    self.socket.setMulticastTTL(1);
    self.socket.setMulticastLoopback(true);
    self.socket.addMembership(self.multicastAddress);
  });

  self.socket.on('error', function (err) {
    self.emit('error', err);
  });

  self.socket.on('message', function (message) {
    debug('Received "%s" over the network.', message);

    try {
      message = JSON.parse(message);
    } catch (e) {
      // Ignore.
      return;
    }

    self._handleAnnouncement(message);
  });

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype._startAnnouncements = _startAnnouncements;
function _startAnnouncements() {
  var self = this;

  self._annouceTimerId = setInterval(function () {
    self._sendAnnouncement();
  }, self.interval);

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype._sendAnnouncement = _sendAnnouncement;
function _sendAnnouncement() {
  var self = this;
  var body = new Buffer(JSON.stringify(self.services));

  debug('Sending: %s', body);

  self.socket.send(body, 0, body.length, self.port, self.multicastAddress);

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype._stopAnnouncements = _stopAnnouncements;
function _stopAnnouncements() {
  var self = this;

  if (!self._announceTimerId) {
    return self;
  }

  clearInterval(self._annouceTimerId);
  self._announceTimerId = null;

  return self;
}

/**
 * TODO: Description.
 */
UdpBroadcastManager.prototype._handleAnnouncement = _handleAnnouncement;
function _handleAnnouncement(body) {
  var self = this;

  Object.keys(body).forEach(function (name) {
    var service = body[name];

    self.emit(service.available ? 'available' : 'unavailable', name, service);
    self.emit('update', name, service);

    if (self._timeoutTimerIds[name]) {
      clearTimeout(self._timeoutTimerIds[name]);
    }

    debug('Setting timeout for %s to %s ms.', name, self.timeout);

    self._timeoutTimerIds[name] = setTimeout(function () {
      self._timeoutTimerIds[name] = null;

      debug('Timeout: %s', name);

      self.emit('unavailable', name, service);
    }, self.timeout);
  });

  return self;
}

/*!
 * Export `UdpBroadcastManager`.
 */
module.exports = UdpBroadcastManager;
