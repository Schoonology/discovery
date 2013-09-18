/**
 * @fileOverview
 * A simple UDP multicast discovery. The Discovery object is a singleton,
 * acquired with the getDiscovery. Announcements are sent out at intervals that
 * may be unique to each service. If an announcement is not seen in 2x the
 * advertised announcement interval, the service is marked as unavailable.
 *
 * The Discovery object emits a single event, 'available' that is sent when the
 * service is first seen, an available service times out with no announcements
 * or the service changes its availability status.
 */
'use strict';
var dgram = require('dgram');
var util = require('util');
var events = require('events');

// Constants
var MULTICAST_ADDRESS = '224.0.0.234';
var MULTICAST_PORT = 44201;
var TIMEOUT_INT = 2000;
var DEFAULT_ANN_INT = 3000;
var DEFAULT_DGRAM_TYPE = 'udp4';

// The object is a singleton globally stored here
var singleton;

// We use events and must inherit from events.EventEmitter
util.inherits(Discovery, events.EventEmitter);

/**
 * Get a discovery object. If one does not yet exist, create it. If one exists,
 * return the existing object.
 * @return {Object} A Discovery object.
 */
exports.getDiscovery = function(options) {
  if (!singleton) {
    singleton = new Discovery(options);
    return singleton;
  }
  if (options && (options.debug || singleton.debug)) {
    console.warn('getDiscovery receiving options after object already '+
                 ' created.');
  }
  return singleton;
};

/**
 * Creates a Discovery object. The options object is optional. Supported options
 * are:
 *   - port - Set the port the service listens on for announcements default:
 *     44201
 *   - bindAddr - bind to an address
 *   - dgramType - Either 'udp4' or 'udp6', default: 'udp4'.
 *   - debug - display debug messages to the console, default: false
 *
 * @param {Object} options A configuration object.
 * @constructor
 */
function Discovery(options) {
  // for use in callbacks where this is not the this I care about
  var self = this;

  // optionally send errors to console
  self.debug = (options && options.debug) ? options.debug : false;

  // Create a dgram socket and bind it
  self.dgramType = (options && options.dgramType) ?
                    options.dgramType.toLowerCase() : DEFAULT_DGRAM_TYPE;
  self.socket = dgram.createSocket(self.dgramType);
  self.port = (options && options.port) ? options.port : MULTICAST_PORT;
  self.bindAddr = (options && options.bindAddr) ? options.bindAddr : undefined;
  self.socket.bind(self.port, self.bindAddr);

  // create an interval task to check for announcements that have timed out
  self.timeOutId = setInterval(handleTimeOut, TIMEOUT_INT, self);

  // listen and listen for multicast packets
  self.socket.on('listening', function() {
    //if (!multicast) self.socket.setMulticastTTL(0);
    self.socket.addMembership(MULTICAST_ADDRESS);
  });

  // handle any announcements, here we just do the formatting
  self.socket.on('message', function(message, rinfo) {
    if (message) {
      var obj = jsonStrToObj(message.toString());
      if (!obj) {
        this.error('Dicovery bad announcement: '+message.toString());
        return;
      }
      // the real work is done in handleAnnouncement
      self.handleAnnouncement(obj, rinfo);
    }
  });
}

/**
 * Sets up announcements for a service.
 * @param {Object} serviceObject An object describing the service to announce.
 * @return {Boolean} true, if successful false otherwise.
 */
Discovery.prototype.announce = function(serviceObject) {
  if (!serviceObject || !serviceObject.name) {
    this.error('Discovery.accounce error: '+util.inspect(serviceObject));
    return false;
  }

  // make a copy of the object
  var copy = copyObj(serviceObject);
  if (!copy) {
    this.error('Discovery.announce error: bad serviceObject: '+
               util.inspect(serviceObject));
  }

  // attempt to add the announcement return result to user
  return this.addNewAnnouncement(copy);
};

/**
 * Stops announcements for a service.
 * @param {String} name The name of the service to resume announcements.
 * @return {Boolean} true, if successful false otherwise.
 */
Discovery.prototype.stopAnnounce = function(name) {
  // we have to have a name that is string and not empty
  if (!name || typeof name !== 'string' || !name.length) {
    this.error('Discovery.stopAnouncement: bad name param: '+
               util.inspect(name));
    return false;
  }

  // the service has to be already known to stop announcing
  if (!this.services || !this.services[name]) {
    this.error('Discovery.stopAnnounce error: no entry for \''+name+'\'');
    return false;
  }

  // if there is no task to do the announcing, quit
  if (!this.services[name].intervalId) {
    this.error('Discovery.stopAnnounce error: not announcing \''+name+'\'');
    return false;
  }

  // clear the interval and remove the intervalId property
  clearInterval(this.services[name].intervalId);
  delete this.services[name].intervalId;
  return true;
};

/**
 * Resumes announcements for a service.
 * @param {String} name The name of the service to resume announcements.
 * @return {Boolean} true, if successful false otherwise.
 */
Discovery.prototype.resumeAnnounce = function(name) {
  // we need a name that is a string which is not empty
  if (!name || typeof name !== 'string' || !name.length) {
    this.error('Discovery.resumeAnnounce error: invalid name: '+
               util.inspect(name));
    return false;
  }

  // the service has to be known to resume
  if (!this.services || !this.services[name]) {
    this.error('Discovery.resumeAnnounce error: no entry for \''+name+'\'');
    return false;
  }

  // there can't be an interval task doing announcing to resume
  if (this.services[name].intervalId) {
    this.error('Discovery.resumeAnnounce error: already announcing \''+
               name+'\'');
    return false;
  }

  // create an interval task and store the id
  this.services[name].intervalId = setInterval(sendAnnounce,
                                       this.services[name].annInterval, this,
                                       this.services[name].data);
  return true;
};

/**
 * Adds new announcements to the services object. Takes care of adding missing
 * values that have defaults, making the name property constant, and emitting
 * the correct events.
 * @param {Object} ann An announcement describing the service.
 * @param {Object} rinfo An object describing the sender with address, etc.
 */
Discovery.prototype.addNewAnnouncement = function(ann, rinfo) {
  // ensure the ann is an object that is not empty
  if (!ann || typeof ann !== 'object' || !Object.keys(ann).length) {
    this.error('Discovery.addNewAnnouncement error: bad announcement: '+
               util.inspect(ann));
    return false;
  }

  // also, the ann obj needs a name
  if (!ann.name) {
    this.error('Discovery.addNewAnnouncement error: no name.');
    return false;
  }
  // add defaults, if needed
  if (!ann.proto)  ann.proto = 'tcp';
  if (!ann.addrFamily)  ann.addrFamily = 'IPv4';
  if (!ann.annInterval)  ann.annInterval = DEFAULT_ANN_INT;
  if (!ann.available)  ann.available = true;

  // set the name property to be read-only - it would be confusing if it changed
  // as it is the key.
  Object.defineProperty(ann, 'name', {
    value: ann.name,
    writable: false,
    enumerable: true,
    configurable: true
  });

  // create the services storage if need be
  if (!this.services)  this.services = {};

  // The entry should not already exist
  if (this.services[ann.name]) {
    this.error('Discovery.addNewAnnouncement for \''+ann.name+
               '\', but it already exists.');
    return false;
  }

  this.services[ann.name] = {};
  this.services[ann.name].data = ann;
  // since it's new - send an event
  this.emit('available', ann.name, ann.available, ann, 'new');

  // save the previous availability
  var oldAvail = this.services[ann.name].data.available;
  this.services[ann.name].data = ann;

  // if there is no host set, grab the host from rinfo
  if (rinfo && rinfo.address) {
    var host = this.services[ann.name].data.host;
    if (!host || typeof host !== 'string' || !host.length)
      this.services[ann.name].data.host = rinfo.address;
  }

  // update the lanst announcement time to now
  this.services[ann.name].lastAnnTm = Date.now();

  // create an interval task to repeatedly send announcements
  this.services[ann.name].intervalId = setInterval(sendAnnounce,
                                                   ann.annInterval, this, ann);

  // if the availability changed, send an event
  if (ann.available !== oldAvail)
    this.emit('available', ann.name, ann.available, ann, 'availabilityChange');

  return true;
};

/**
 * Resumes announcements for a service.
 * @param {String} name The name of the service to resume announcements.
 * @param {Object} rinfo An object with the sender's address information.
 * @return {Boolean} true, if successful false otherwise.
 */
Discovery.prototype.handleAnnouncement = function(ann, rinfo) {
  // ensure the ann is an object that is not empty
  if (!ann || typeof ann !== 'object' || !Object.keys(ann).length) {
    this.error('Discovery.handleAnnouncement bad ann: '+util.inspect(ann));
    return false;
  }

  // also, the ann obj needs a name
  if (!ann.name) {
    this.error('Discovery.handleAnnouncement error: no name.');
    return false;
  }

  // two cases, if the entry exists or does not
  if (this.services && this.services[ann.name]) {
    // this is an existing entry
    var oldAvail = this.services[ann.name].data.available;
    // update the lanst announcement time to now
    this.services[ann.name].lastAnnTm = Date.now();
    // if the availability changed, send an event
    if (ann.available !== oldAvail)
      this.emit('available', ann.name, ann.available, ann, 'availabilityChange');
  } else {
    // the entry is new, add it
    return this.addNewAnnouncement(ann, rinfo);
  }

  return true;
};

/**
 * Retrieves service information by name.
 * @param {String} name The name of the service for which you want data.
 * @return {Object|Boolean} The object describing the srevice if available, and
 *   false otherwise.
 */
Discovery.prototype.getService = function(name) {
  // handle conditions for which there is no answer
  if (!name || typeof name !== 'string' || !name.length)  return false;
  if (!this.services || !this.services[name])  return false;
  // Developers just want annoucement data, send that.
  return this.services[name].data;
};

/**
 * Optionally display error messages to the console.
 * @param {String} err An error string to display.
 * @private
 */
Discovery.prototype.error = function(err) {
  if (this.debug)  console.error(err);
};

/**
 * Optionally display warning messages to the console.
 * @param {String} err An error string to display.
 * @private
 */
Discovery.prototype.warn = function(err) {
  if (this.debug)  console.warn(err);
};

/**
 * Optionally display log messages to the console.
 * @param {String} msg An log string to display.
 * @private
 */
Discovery.prototype.log = function(msg) {
  if (this.debug)  console.warn(msg);
};

/**
 * Setup to send announcements for a service over UDP multicast.
 * @return {Boolean} true, if successful false otherwise.
 * @private
 */
function sendAnnounce(discObj, servObj) {
  var str = objToJsonStr(servObj);
  if (!str) {
    discObj.error('sendAnnounce error: can\'t stringify: '+
                  util.inspect(servObj));
    return;
  }

  // send the stringified buffer over multicast
  var buf = new Buffer(str);
  discObj.socket.send(buf, 0, buf.length, discObj.port, MULTICAST_ADDRESS);
}

/**
 * Handle timeouts on announcements. Deletes timed out entries from services.
 * @param {Object} discObj A Discovery object.
 * @private
 */
function handleTimeOut(discObj) {
  // ensure we have an object
  if (!discObj || typeof discObj !== 'object') {
    discObj.error('handleTimeOut bad object received:'+util.inspect(discObj));
    return;
  }

  // Also the object should have a services storage on it
  if (!discObj.services) return;

  var now = Date.now();             // timestamp in ms
  var services = discObj.services;  // quick ref for storage

  // iterate over all the properties in hash object
  for (var serv in services) {
    // every object should have a timestamp - what's up here?
    if (!services[serv].lastAnnTm) {
      discObj.error('Service \''+serv+'\' has no time stamp. Adding one.');
      services[serv].lastAnnTm = Date.now();
      continue;
    }

    // if the time since the last announce is greater than 2X the announcement
    // interval, we timed out.
    if ((now - services[serv].lastAnnTm) > 2*services[serv].data.annInterval) {
      // emit an event to denote the change in status
      discObj.emit('available', serv, false, services[serv].data, 'timedOut');
      // delete the entry
      delete services[serv];
    }
  }
}

/**
 * A convenience function to copy an object. Must be an object that can be
 * serialized into JSON.
 * @param {Object} obj An object to be copied.
 * @return {Object|Boolean} returns the object copy or false, if there was an
 *   error.
 * @private
 */
function copyObj(obj) {
  var newObj;
  try {
    newObj = JSON.parse(JSON.stringify(obj));
  } catch(err) {
    return false;
  }
  return newObj;
}

/**
 * A convenience function to convert a JSON string to an object.
 * @param {String} str A stringified JSON representation.
 * @return {Object|Boolean} returns the object representation of the JSON, if
 * the str representation is is legal and false otherwise.
 * @private
 */
function jsonStrToObj(str) {
  var obj;
  try {
    obj = JSON.parse(str);
  } catch(err) {
    return false;
  }
  return obj;
}

/**
 * A convenience function to convert an object to a JSON string.
 * @param {Object} obj A javascript object than can be converted to JSON
 * @return {String|Boolean} The JSON string if possible and false otherwise.
 * @private
 */
function objToJsonStr(obj) {
  var str;
  try {
    str = JSON.stringify(obj);
  } catch(err) {
    return false;
  }
  return str;
}

