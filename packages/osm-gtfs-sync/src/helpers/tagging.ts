import { VehicleType } from 'gtfs-types';
import type { Tags } from 'osm-api';

/** determines the value for the `route=*` OSM tag */
export function getRouteTagsForTransportMode(
  vehicleType: VehicleType,
  warnings: Set<string>,
): Tags {
  switch (vehicleType) {
    case VehicleType.GENERIC_BUS:
    case VehicleType.SPECIAL_COACH:
    case VehicleType.REGIONAL_COACH:
    case VehicleType.RAIL_REPLACEMENT_BUS:
    case VehicleType.BUS: {
      return { route: 'bus' };
    }

    case VehicleType.REGIONAL_RAIL:
    case VehicleType.CABLE_CAR:
    case VehicleType.TRAIN: {
      return { route: 'train' };
    }

    case VehicleType.FERRY: {
      return { route: 'ferry' };
    }

    case VehicleType.TRAM: {
      return { route: 'tram' };
    }

    case VehicleType.LIGHT_RAIL: {
      return { route: 'light_rail' };
    }

    case VehicleType.METRO_RAIL:
    case VehicleType.METRO: {
      return { route: 'subway' };
    }

    case VehicleType.SCHOOL_BUS: {
      return { route: 'bus', access: 'no', school_bus: 'designated' };
    }

    default: {
      warnings.add(`Mode of transport not supported (${vehicleType})`);
      return { route: 'yes' };
    }
  }
}

/**
 * If a stop supports multiple modes of transport, then all
 * the tags are merged together from each mode of transport.
 */
export function getStopTagsForTransportMode(
  vehicleType: VehicleType,
  warnings: Set<string>,
) {
  switch (vehicleType) {
    case VehicleType.GENERIC_BUS:
    case VehicleType.SPECIAL_COACH:
    case VehicleType.REGIONAL_COACH:
    case VehicleType.RAIL_REPLACEMENT_BUS:
    case VehicleType.SCHOOL_BUS:
    case VehicleType.BUS: {
      return {
        highway: 'bus_stop',
        public_transport: 'platform',
        bus: 'yes',
        // school_bus logic is special-cased elsewhere
      };
    }

    case VehicleType.REGIONAL_RAIL:
    case VehicleType.CABLE_CAR:
    case VehicleType.TRAIN: {
      return {
        railway: 'stop',
        public_transport: 'stop_position',
        train: 'yes',
      };
    }

    case VehicleType.TRAM: {
      return {
        railway: 'tram_stop',
        public_transport: 'stop_position',
        tram: 'yes',
      };
    }

    case VehicleType.LIGHT_RAIL: {
      return {
        railway: 'stop',
        public_transport: 'stop_position',
        light_rail: 'yes',
      };
    }

    case VehicleType.METRO_RAIL:
    case VehicleType.METRO: {
      return {
        railway: 'stop',
        public_transport: 'stop_position',
        subway: 'yes',
      };
    }

    case VehicleType.FERRY: {
      return {
        // 'seamark:type': 'berth',
        public_transport: 'stop_position',
        ferry: 'yes',
      };
    }

    default: {
      warnings.add(`Mode of transport not supported (${vehicleType})`);
      return { public_transport: 'stop_position' };
    }
  }
}
