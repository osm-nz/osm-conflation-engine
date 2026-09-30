import type { NetworkConfig } from '../types/config.def.js';
import { AU } from './AU.js';
import { NZ } from './NZ.js';
import { US } from './US.js';

export const CONFIG: NetworkConfig[] = [
  //
  ...AU,
  ...NZ,
  ...US,
];
