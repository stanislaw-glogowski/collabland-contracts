import { HardhatUserConfig } from 'hardhat/config';
import { getEnvAsHex32, getEnvAsNumber, getEnvAsURL } from '../utils';

const DEFAULT_HARDHAT_PRIVATE_KEY =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const SUPPORTED_NETWORKS: {
  name: string;
  chainId: number;
  url: string;
  privateKey?: string;
}[] = [
  {
    name: 'local',
    chainId: 31337,
    url: 'http://localhost:9545',
    privateKey: DEFAULT_HARDHAT_PRIVATE_KEY,
  },
  {
    name: 'local-optimism',
    chainId: 17,
    url: 'http://localhost:8545',
    privateKey: DEFAULT_HARDHAT_PRIVATE_KEY,
  },
  {
    name: 'kovan',
    chainId: 42,
    url: 'https://kovan.infura.io/v3',
  },
  {
    name: 'kovan-optimism',
    chainId: 69,
    url: 'https://kovan-optimistic.etherscan.io',
  },
  {
    name: 'gnosis',
    chainId: 100,
    url: 'https://rpc.gnosischain.com',
  },
  {
    name: 'gnosis-optimism',
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
    ...SUPPORTED_NETWORKS.reduce(
      (result, { url, name, chainId, privateKey }) => {
        const account = getEnvAsHex32(`${name}.PRIVATE_KEY`, privateKey);

        return {
          ...result,
          [name]: {
            chainId: getEnvAsNumber(`${name}.CHAIN_ID`, chainId),
            url: getEnvAsURL(`${name}.URL`, url),
            accounts: account ? [account] : [],
            saveDeployments: true,
          },
        };
      },
      {},
    ),
  },
};
