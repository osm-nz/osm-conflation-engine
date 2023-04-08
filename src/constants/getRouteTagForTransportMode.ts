import { VehicleType } from "gtfs-types";

/** determines the value for the `route=*` OSM tag */
export function getRouteTagForTransportMode(vehicleType: VehicleType) {
  switch (vehicleType) {
    case VehicleType.BUS:
      return "bus";
    case VehicleType.TRAIN:
      return "train";
    case VehicleType.FERRY:
      return "ferry";
    default: {
      console.error(`Mode of transport not supported (${vehicleType})`);
      return "yes";
    }
  }
}
