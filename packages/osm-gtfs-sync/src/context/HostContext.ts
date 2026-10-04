import { createContext } from 'react';
import type { IHostContext } from '../types/host.def.js';

export const HostContext = createContext<IHostContext>(undefined!);
HostContext.displayName = 'HostContext';
