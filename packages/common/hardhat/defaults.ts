import { HardhatUserConfig } from 'hardhat/config';
import { SUPPORTED_NETWORKS } from './predefined';
import { Envs, ProcessEnvNames } from './shared';

export const DEFAULT_HARDHAT_SOLIDITY_CONFIG: HardhatUserConfig['solidity'] = {
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
};

export const DEFAULT_HARDHAT_NETWORKS_CONFIG: HardhatUserConfig['networks'] = {
  hardhat: { saveDeployments: false },
  ...Object.entries(SUPPORTED_NETWORKS)
    .map(([name, network]) => ({ name, ...network }))
    .reduce((result, { url, name, chainId, optimism }) => {
      const { useNamespace } = Envs.processEnvs;
      const { getEnvAsHex32, getEnvAsURL, getEnvAsBool } = useNamespace(name);

      const privateKey = getEnvAsHex32(ProcessEnvNames.PrivateKey);

      return {
        ...result,
        [name]: {
          chainId,
          optimism,
          url: getEnvAsURL(ProcessEnvNames.Url, url),
          accounts: privateKey ? [privateKey] : [],
          saveDeployments: getEnvAsBool(
            ProcessEnvNames.SaveLocalDeployments,
            true,
          ),
        },
      };
    }, {}),
};

export const DEFAULT_HARDHAT_CONFIG: HardhatUserConfig = {
  solidity: DEFAULT_HARDHAT_SOLIDITY_CONFIG,
  networks: DEFAULT_HARDHAT_NETWORKS_CONFIG,
};
