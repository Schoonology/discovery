#sc-discovery
This module provides discovery services for super-cluster using UDP multicast.
Later, an expanded implementation able to scaled up to a few thousand instances
and work across wide area networks.

For now, this implements the zero-configuration UDP multicast discovery. This
works only between nodes on the same subnet as typically, broadcast packets
don't route.

## Discovery API

### new Discovery([options])

Invokes the constructor to create an instance of Discovery to receive discovery
events.  The config options object is optional, but if included, the following
options are available:

* {Number} `port` - The port to listen upon for service announcements. Default:
  44201.
* {String} `bindAddr` - The address to bind to. Default: listens to all
  interfaces.
* {String} `dgramType` - Either 'udp4' or 'udp6'. Default: 'udp4'.

### Discovery.announce\(name, userData, \[,interval\] \[,available\]\)
Starts announcing the service at the specified interval. The parameter,
`serviceObject`, is an object describing the service that sc-discovery
announces.

* {String} `name` The name of the service being announced. It must be unique, or it will
  collide with another.
* {Number} `interval` The duration between announcements in milliseconds.
* {Any} `userData` Any data that can be serialized into JSON.
* {Boolean} `available` Optional parameter to set availability of the service. If not
  specified, the default is 'true', meaning available.

Any property with a default can be left out and the code supplies the default
value. The name and data are required.

#### Discovery.pause\(name\)
- {String} `name` The name of the service.
- Returns true if successful, false otherwise.

Halts announcements.

#### Discovery.resume\(name, \[,interval\]\\)
- {String} `name` The name of the service.
- {Number} `interval` Optional interval between announcements in ms.
- Returns true if successful, false otherwise.

Resumes the announcements at the time interval.

#### Discovery.getData\(name\)
- {String} `name `- The name of the service.
- returns: {Object} The serviceObject from announce.

Returns the service object, which can be modified. For example, if you need to
alter the `userData`, you can. You cannot, however, alter the name (it's a
constant property).

#### Discovery.update\(name, userData \[,interval\] \[,available\]\)
Updates the existing service.

* {String} `name` The name of the service being announced. It must be unique, or it will
  collide with another.
* {Any} `userData` Any data that can be serialized into JSON.
* {Number} [`interval`] Optional duration between announcements in milliseconds.
* {Boolean} [`available`] Optional parameter to set availability of the service. If not
  specified, the default is 'true', meaning available.

#### Discovery Events

##### 'available'
Has the following parameters:

- {String} name - The name of the service.
- {Object} data - User-defined object describing the service.
- {String} reason - Why this event was sent: 'new', 'availabilityChange',
  'timedOut'.

This event can happen when:

- The first announcement for a service is received.
- The availability changes, if the available status changes from false to true.

##### 'unavailable'
Has the following parameters:

- {String} name - The name of the service.
- {Object} data - User-defined object describing the service.
- {String} reason - Why this event was sent: 'new', 'availabilityChange',
  'timedOut'.

This event can happen when:

- The first announcement for a service is received and the service is
  unavailable..
- The availability changes, if the available status changes from true to false.
- When 2x the announce interval time for the service elapsed without an
  announcement being seen. The service is considered unavailable and removed
  from the list of services.

