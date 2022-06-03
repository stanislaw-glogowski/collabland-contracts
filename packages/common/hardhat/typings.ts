import 'hardhat/types/config';
import 'hardhat/types/runtime';
import type { Helpers } from './environment';
import type { Envs, Optimism, OptimismConfig } from './shared';

declare module 'hardhat/types/config' {
  export interface HardhatNetworkConfig {
    optimism?: OptimismConfig;
  }

  export interface HttpNetworkConfig {
    optimism?: OptimismConfig;
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
