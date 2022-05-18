import { HardhatUserConfig } from 'hardhat/config';
import { getEnvAsHex32 } from '../utils';

const SUPPORTED_NETWORKS: {
  name: string;
  chainId: number;
  url: string;
}[] = [
  {
    name: 'optimism-gnosis',
    chainId: 300,
    url: 'https://optimism.gnosischain.com',
  },
];

export const DEFAULT_HARDHAT_CONFIG: HardhatUserConfig = {
  solidity: {
    version: '0.8.9',
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
    ...SUPPORTED_NETWORKS.reduce((result, { url, name, chainId }) => {
      const account = getEnvAsHex32(`${name}.PRIVATE_KEY`);

      return {
        ...result,
        [name]: {
          url,
          chainId,
          accounts: account ? [account] : [],
        },
      };
    }, {}),
  },
};
