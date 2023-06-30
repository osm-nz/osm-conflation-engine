import { VehicleType } from "gtfs-types";

/** determines the value for the `route=*` OSM tag */
export function getRouteTagsForTransportMode(vehicleType: VehicleType) {
  switch (vehicleType) {
    case VehicleType.BUS: {
      return { route: "bus" };
    }

    case VehicleType.CABLE_CAR:
    case VehicleType.TRAIN: {
      return { route: "train" };
    }

    case VehicleType.FERRY: {
      return { route: "ferry" };
    }

    case VehicleType.SCHOOL_BUS: {
      return { route: "bus", access: "no", school_bus: "designated" };
    }

    default: {
      console.error(`Mode of transport not supported (${vehicleType})`);
      return { route: "yes" };
    }
  }
}
