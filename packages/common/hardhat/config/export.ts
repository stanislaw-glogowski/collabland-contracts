import { HardhatUserConfig } from 'hardhat/config';
import { SOLIDITY_VERSION, NETWORKS } from './constants';
import { Envs } from '../shared';

const envs = Envs.getInstance();

const { getEnvAsBool } = envs;

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
    ...Object.entries(NETWORKS)
      .map(([name, network]) => ({ name, ...network }))
      .reduce(
        (result, { url, name, chainId, isLocal, crossDomainMessenger }) => {
          const networkEnvs = envs.cloneWith(name);

          const {
            getEnvAsHex32,
            getEnvAsNumber,
            getEnvAsURL,
            getEnvAsAddress,
          } = networkEnvs;

          const privateKey = getEnvAsHex32('PRIVATE_KEY');

          return {
            ...result,
            [name]: {
              chainId: getEnvAsNumber('CHAIN_ID', chainId),
              url: getEnvAsURL('URL', url),
              crossDomainMessenger: getEnvAsAddress(
                'CROSS_DOMAIN_MESSENGER',
                crossDomainMessenger,
              ),
              accounts: privateKey ? [privateKey] : [],
              saveDeployments: !isLocal || SAVE_LOCAL_DEPLOYMENTS,
            },
          };
        },
        {},
      ),
  },
  envs: {},
};
