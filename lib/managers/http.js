'use strict';
/*!
 * TODO: Description.
 */
var util = require('util');
var Manager = require('../manager');

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


}
util.inherits(HttpManager, Manager);

/*!
 * Export `HttpManager`.
 */
module.exports = HttpManager;
