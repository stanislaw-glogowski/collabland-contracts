import 'hardhat/types/config';
import 'hardhat/types/runtime';
import type { Helpers } from './environment';
import type { Envs } from './shared';

declare module 'hardhat/types/config' {
  export interface HardhatConfig {
    envs?: Record<string, string>;
  }

  export interface HardhatUserConfig {
    envs?: Record<string, string>;
  }
}

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    helpers: Helpers;
    envs: Envs;
    globalEnvs: Envs;
  }
}
