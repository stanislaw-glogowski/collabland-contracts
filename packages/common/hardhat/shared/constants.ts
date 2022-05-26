/* eslint-disable no-unused-vars */

export const HARDHAT_MNEMONIC =
  'test test test test test test test test test test test junk';

export const HARDHAT_PATH_PREFIX = `m/44'/60'/0'/0/`;

export enum NetworkNames {
  Local = 'local',
  LocalOptimism = 'local-optimism',
  Kovan = 'kovan',
  KovanOptimism = 'kovan-optimism',
  Gnosis = 'gnosis',
  GnosisOptimism = 'gnosis-optimism',
}

export enum ProcessEnvNames {
  SaveLocalDeployments = 'SAVE_LOCAL_DEPLOYMENTS',
  PrivateKey = 'PRIVATE_KEY',
  Url = 'URL',
}
