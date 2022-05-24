import 'hardhat/types/config';
import 'hardhat/types/runtime';
import type { Helpers } from './environment';
import type { Envs, Optimism } from './shared';

declare module 'hardhat/types/config' {
  export interface HardhatNetworkConfig {
    optimism?: Optimism;
  }

  export interface HttpNetworkConfig {
    optimism?: Optimism;
  }
}

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    helpers: Helpers;
    processEnvs: Envs;
    processNetworkEnvs: Envs;
    optimism: Optimism;
  }
}
