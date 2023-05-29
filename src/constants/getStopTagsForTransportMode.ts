import { VehicleType } from "gtfs-types";

export function getStopTagsForTransportMode(vehicleType: VehicleType) {
  switch (vehicleType) {
    case VehicleType.SCHOOL_BUS:
    case VehicleType.BUS: {
      return {
        highway: "bus_stop",
        public_transport: "platform",
        bus: "yes",
      };
    }
    case VehicleType.CABLE_CAR:
    case VehicleType.TRAIN: {
      return {
        railway: "stop",
        public_transport: "stop_position",
        train: "yes",
      };
    }
    case VehicleType.FERRY: {
      return {
        // "seamark:type": "berth",
        public_transport: "stop_position",
        ferry: "yes",
      };
    }
    default: {
      console.error(`Mode of transport not supported (${vehicleType})`);
      return { public_transport: "stop_position" };
    }
  }
}
