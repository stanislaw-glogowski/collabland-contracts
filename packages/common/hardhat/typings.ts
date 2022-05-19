import 'hardhat/types/config';
import 'hardhat/types/runtime';
import type { Helpers } from './environment';

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    helpers: Helpers;
  }
}

declare module 'hardhat/types/config' {
  export interface HardhatNetworkUserConfig {
    test1?: any;
  }
}
