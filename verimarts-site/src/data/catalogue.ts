import { vehicles } from "./vehicles";
import type { Vehicle } from "./vehicles";
// Replace this repository with a remote implementation when a backend is introduced.
export const catalogue = {
  async list(): Promise<Vehicle[]> {
    return vehicles;
  },
  async find(id: string): Promise<Vehicle | undefined> {
    return vehicles.find((v) => v.id === id);
  },
};
