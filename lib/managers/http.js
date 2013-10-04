'use strict';
var http = require('http');
var util = require('util');
var debug = require('../debug')('discovery:Http');
var Manager = require('../manager');

var Defaults = {
  PORT: 4201,
  INTERVAL: 3000
};

/**
 * Creates a new instance of HttpManager with the provided `options`.
 *
 * The HttpManager provides a client connection to the HTTP-based, Tracker
 * discovery system.
 *
 * For more information, see the README.
 *
 * @param {Object} options
 */
function HttpManager(options) {
  if (!(this instanceof HttpManager)) {
    return new HttpManager(options);
  }

  options = options || {};

  Manager.call(this, options);

  debug('New HttpManager: %j', options);

  this.host = options.host || null;
  this.port = options.port || Defaults.PORT;

  this.interval = options.interval || Defaults.INTERVAL;

  this._annouceTimerId = null;

  this._startAnnouncements();
}
util.inherits(HttpManager, Manager);
HttpManager.Defaults = Defaults;

/**
 * TODO: Description.
 */
HttpManager.prototype.destroy = destroy;
function destroy() {
  var self = this;

  self._stopAnnouncements();

  return self;
}

/**
 * For each of these methods, we want to replicate what Manager does, but send
 * and extra announcement.
 */
['addLocalService', 'removeLocalService', 'updateLocalService']
  .forEach(function (name) {
    HttpManager.prototype[name] = function (service) {
      Manager.prototype.addLocalService.call(this, service);
      this._sendAnnouncement();
      return this;
    };
  });

/**
 * TODO: Description.
 */
HttpManager.prototype._startAnnouncements = _startAnnouncements;
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
HttpManager.prototype._sendAnnouncement = _sendAnnouncement;
function _sendAnnouncement() {
  var self = this;
  var body = new Buffer(JSON.stringify({ services: self.services }));

  debug('Sending: %s', body);

  http
    .request({
      hostname: self.host,
      port: self.port,
      method: 'POST'
    })
    .on('error', function (err) {
      self.emit('error', err);
    })
    .on('response', function (res) {
      var buffer = '';

      res
        .on('data', function (chunk) {
          buffer += String(chunk);
        })
        .on('end', function () {
          try {
            buffer = JSON.parse(buffer);
          } catch (e) {
            return;
          }

          self._handleAnnouncement(buffer);
        })
        .on('error', function (err) {
          self.emit('error', err);
        });
    })
    .end(body);

  return self;
}

/**
 * TODO: Description.
 */
HttpManager.prototype._stopAnnouncements = _stopAnnouncements;
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
HttpManager.prototype._handleAnnouncement = _handleAnnouncement;
function _handleAnnouncement(body) {
  var self = this;

  Object.keys(body).forEach(function (name) {
    var service = body[name];

    self.emit(service.available ? 'available' : 'unavailable', name, service);
    self.emit('update', name, service);
  });

  return self;
}

/*!
 * Export `HttpManager`.
 */
module.exports = HttpManager;
