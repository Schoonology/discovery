#sc-discovery
---
This module provides discovery services for super-cluster using UDP multicast.
Later, an expanded implementation using
[node-discover](https://github.com/tristanls/node-discover "GitHub Link") will
exist.

For now, this implements the zero-configuration UDP multicast discovery. This
works only between nodes on the same subnet as typically, broadcast packets
don't route.

## Discovery Object Interface

### var Discovery = getDiscovery([options])

Acquires the singleton discovery object able to send and receive discovery
events.  The config options object is optional, but if included, the following
options are available:

* `port` - The port to listen upon for service announcements. Default: 44201.
* `bindAddr` - The address to bind to. Default: listens to all interfaces.
* `dgramType` - Either 'udp4' or 'udp6'. Default: 'udp4'.
* `debug` - Display debug messages to the console. Default: false.

### Discovery.announce(serviceObject)
Starts announcing the service at the specified interval. The parameter,
`serviceObject`, is an object describing the service that sc-discovery
announces.

The members of `serviceObject` are:

* `name` - Name of the service being announced. Required.
* `host` - String: Host IP or DNS address. Default: the sending IP address.
* `port` - Number: The port upon which the service listens for connections.
* `proto` - String: protocol for the service being announced. Could be 'tcp'
  or 'udp'. 'tcp' is the default. Case does not matter.
* `addrFamily` - String: By default 'IPv4', could also be 'IPv6'.
* `annInterval` - Number: interval to send announcements in milliseconds.
  Default is 3000.
* `available` - Boolean: true if service is available, false otherwise.
* `userData` - Anything serializable into JSON.

Any property with a default can be left out and the code supplies the default
value.

#### Discovery.stopAnnouncements\(name\)
- {String} `name` The name of the service.
- Returns true if successful, false otherwise.

Halts announcements.

#### Discovery.resumeAnnouncements\(name\)
- {String} `name` The name of the service.
- Returns true if successful, false otherwise.

Resumes the announcements at the time interval.

#### Discovery.getService\(name\)
- {String} `name `- The name of the service.
- returns: {Object} The serviceObject from announce.

Returns the service object, which can be modified. For example, if you need to
alter the `userData`, you can. You cannot, however, alter the name (it's a
constant property).

#### Discovery Events

##### 'available'
Has the following parameters:

- {String} name - The name of the service.
- {Boolean} available - True, if the service is available, false otherwise.
- {Object} serviceObject - Object describing the service.
- {String} reason - Why this event was sent: 'new', 'availabilityChange',
  'timedOut'.

This event happens when:

- The first announcement for a service is received.
- The availability changes, if the available status changes from true to false
  or vice-versa.
- When 2x the announce interval time for the service elapsed without an
  announcement being seen. The service is considered unavailable and removed
  from the list of services.

