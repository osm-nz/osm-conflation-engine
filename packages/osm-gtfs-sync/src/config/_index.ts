import type { NetworkConfig } from '../types/config.def.js';
import { AU } from './AU.js';
import { CA } from './CA.js';
import { CZ } from './CZ.js';
import { DE } from './DE.js';
import { NZ } from './NZ.js';

export const CONFIG: NetworkConfig[] = [
  //
  ...AU,
  ...CA,
  ...CZ,
  ...DE,
  ...NZ,
];
