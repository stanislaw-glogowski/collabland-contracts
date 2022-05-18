import 'hardhat/types/runtime';
import type { Helpers } from './Helpers';

declare module 'hardhat/types/runtime' {
  export interface HardhatRuntimeEnvironment {
    helpers: Helpers;
  }
}
