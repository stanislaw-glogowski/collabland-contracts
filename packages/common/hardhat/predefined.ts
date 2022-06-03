import { NetworkNames, OptimismConfig, OptimismContracts } from './shared';

export const OPTIMISM_L2_CONTRACTS: OptimismContracts = {
  crossDomainMessenger: '0x4200000000000000000000000000000000000007',
};

export const SUPPORTED_NETWORKS: Record<
  string,
  {
    chainId: number;
    url: string;
    optimism: OptimismConfig;
  }
> = {
  [NetworkNames.Local]: {
    chainId: 31337,
    url: 'http://localhost:9545',
    optimism: {
      l1: {
        crossDomainMessenger: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
      },
    },
  },
  [NetworkNames.LocalOptimism]: {
    chainId: 17,
    url: 'http://localhost:8545',
    optimism: {
      l2: OPTIMISM_L2_CONTRACTS,
    },
  },
  [NetworkNames.Kovan]: {
    chainId: 42,
    url: 'https://kovan.infura.io/v3',
    optimism: {
      l1: {
        crossDomainMessenger: '0x4361d0F75A0186C05f971c566dC6bEa5957483fD',
      },
    },
  },
  [NetworkNames.KovanOptimism]: {
    chainId: 69,
    url: 'https://kovan-optimistic.etherscan.io',
    optimism: {
      l2: OPTIMISM_L2_CONTRACTS,
    },
  },
  [NetworkNames.Gnosis]: {
    chainId: 100,
    url: 'https://rpc.gnosischain.com',
    optimism: {
      l1: {
        crossDomainMessenger: '0x4324fdD26161457f4BCc1ABDA87709d3Be8Fd10E',
      },
    },
  },
  [NetworkNames.GnosisOptimism]: {
    chainId: 300,
    url: 'https://optimism.gnosischain.com',
    optimism: {
      l2: OPTIMISM_L2_CONTRACTS,
    },
  },
};
