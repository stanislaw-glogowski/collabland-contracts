import { HardhatUserConfig } from 'hardhat/config';
import {
  getEnvAsHex32,
  getEnvAsNumber,
  getEnvAsURL,
  getEnvAsBool,
} from '../../utils';
import { SOLIDITY_VERSION, NETWORKS } from './constants';

const DEFAULT_HARDHAT_PRIVATE_KEY = getEnvAsHex32(
  'DEFAULT_HARDHAT_PRIVATE_KEY',
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
);

const SAVE_LOCAL_DEPLOYMENTS = getEnvAsBool('SAVE_LOCAL_DEPLOYMENTS');

export const DEFAULT_HARDHAT_CONFIG: HardhatUserConfig = {
  solidity: {
    version: SOLIDITY_VERSION,
    settings: {
      metadata: { bytecodeHash: 'none' },
      optimizer: { enabled: true, runs: 100 },
      outputSelection: {
        '*': {
          '*': [
            'abi',
            'evm.bytecode',
            'evm.deployedBytecode',
            'evm.methodIdentifiers',
            'metadata',
          ],
          '': ['ast'],
        },
      },
    },
  },
  networks: {
    hardhat: { saveDeployments: false },
    ...NETWORKS.reduce((result, { url, name, chainId, isLocal }) => {
      let account = getEnvAsHex32(`${name}.PRIVATE_KEY`);

      if (!account && isLocal) {
        account = DEFAULT_HARDHAT_PRIVATE_KEY;
      }

      return {
        ...result,
        [name]: {
          chainId: getEnvAsNumber(`${name}.CHAIN_ID`, chainId),
          url: getEnvAsURL(`${name}.URL`, url),
          accounts: account ? [account] : [],
          saveDeployments: !isLocal || SAVE_LOCAL_DEPLOYMENTS,
        },
      };
    }, {}),
  },
};
