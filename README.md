# Discovery

Discovery provides dynamic service discovery over a pluggable interface.

## Design

The Registry is the cornerstone of Discovery. Each node in the cluster is
expected to have at least one Registry, with that Registry being responsible
for one or more local Services. Its Manager, in turn, synchronizes the
Registry's understanding of the cluster and its remotely-available Services.

### Services

Discovery makes few assumptions about the format or purpose of Service objects.
All Services must be given a `name`, and will be assigned a universally-unique
`id` to identify instances of a Service that share the same name. The Service
interface provides a consistent interface for managing the metadata associated
with ths service it represents and the announcements thereof.

### Registry

Each Registry is, in essence, a list of Service objects associated with a
Manager to synchronize them across machines. Additionally, the Registry makes an
internal distinction between "local" Services (those in the same process), and
"remote" Services (those on other processes, even if they're on the same
machine).

### Managers

Managers seek to broadcast the presence of a Registry's local Services while
receiving broadcasts about the Services contained in other Registries. The
Manager interface abstracts both the algorithm and transport(s) used for this
synchronization; new transports and algorithms can be plugged into Discovery
through the implementation of a new Manager and the assignment of that
Manager as the `manager` option/property of all Registries within the system.

## API

### Registry `new discovery.Registry(options)` Alias: `discovery.createRegistry`

Creates a new instance of Registry with the provided `options`.

The Registry is the cornerstone of Discovery. Each node in the cluster
is expected to have at least one Registry, with that Registry being responsible
for one or more local Services. Its Manager, in turn, synchronizes the
Registry's understanding of the cluster and its remotely-available Services.

#### destroy `registry.destroy()`

Signals a graceful shutdown of the Registry's and its Manager's internal
resources.

#### createService `registry.createService(name, [data], [available])`

Creates a new, local Service object to represent the named service. This
Service will be synchronized via the Manager to all other Registry objects
in its network. That is, all other Registry objects whose Managers are both
compatible and reachable by this Registry's Manager will emit 'available'
events for this Service.

#### Event: `"available"`

The Registry emits an `"available"` event for every Service that comes
available, whether they be local or remote. Two arguments are passed in to the
event handler: the `name` of the Service and the `data` currently associated
with that Service.

If you need a unique identifier for this Service "instance", use `id`, as
`name` is preserved from the original `createService` call, and may not be
unique.

#### Event: `"unavailable"`

The Registry emits an `"unavailable"` event for every Service that comes
unavailable _after being available at some point in the past_. The arguments
passed in to `"unavailable"` mirror those of `"available"`: `name` and `data.

No guarantees are made beyond the order of events: available, unavailable,
available, unavailable, ... - two events may arrive in the same tick, the
Managers involved may elect to consider your Service(s) "unavailable" for
implementation-specific reasons, and so forth. Design and plan accordingly.

### Service

#### update `service.update(data)`

Merges `data` with the Service's existing `data` property. Returns `true` if
the update was required (i.e. something was different), `false` otherwise
(e.g. `data` remains unchanged).

#### toJSON `service.toJSON()`

Returns a JSON representation of the Service, omitting process-local
details that are inappropriate within other processes, e.g. `local`.

### Manager `new discovery.Manager(options)` Alias: `discovery.createManager`

Creates a new instance of Manager with the provided `options`.

This class provides the abstract interface for more specific Manager
implementations.

See UdpBroadcastManager for a specific example.

#### destroy `manager.destroy()`

Signals a graceful shutdown of the Manager's internal resources.

#### generateId `manager.generateId()`

Returns a Manager-specific unique identifier.

See Registry.generateId for more information.

#### addLocalService `manager.addLocalService(service)`

Used as a signal from the Registry to its Manager that a new local Service
is available.

#### removeLocalService `manager.removeLocalService(service)`

Used as a signal from the Registry to its Manager that a local Service
is no longer available.

#### updateLocalService `manager.updateLocalService(service)`

Used as a signal from the Registry to its Manager that a local Service
has updated its data without updating its availability.

#### toJSON `manager.toJSON()`

Returns a JSON representation of the Manager suitable for logging debug
information.

### UdpBroadcastManager `discovery.UdpBroadcast(options)`

Creates a new instance of UdpBroadcastManager with the provided `options`.

The UdpBroadcastManager provides a client connection to the
zero-configuration, UDP-based discovery system that is used by Discovery
by default. Because it requires zero configuration to use, it's ideal for
initial exploration and development. However, it's not expected to work
at-scale, and should be replaced with the included HTTP-based version.

#### destroy `udpBroadcastManager.destroy()`

Signals a graceful shutdown of the UdpBroadcastManager.

#### generateId `udpBroadcastManager.generateId()`

Returns a UDP-specific unique identifier using the machine's IP address
and the configured port number.

See Manager.generateId for more information.

### HttpManager `discovery.Http(options)`

Creates a new instance of HttpManager with the provided `options`.

The HttpManager provides a client connection to the HTTP-based, Tracker
discovery system.

#### destroy `httpManager.destroy()`

Signals a graceful shutdown of the HttpManager.

#### generateId `httpManager.generateId()`

Returns an HTTP-specific unique identifier using the machine's IP address
and the configured port number.

See Manager.generateId for more information.
