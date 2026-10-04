import type { IHostContext } from '../../types/host.def.js';

// we need this file as a workaround because the tsconfig
// files are different in this monorepo package.
declare const App: React.FC<{ code: string } & IHostContext>;

export default App;
