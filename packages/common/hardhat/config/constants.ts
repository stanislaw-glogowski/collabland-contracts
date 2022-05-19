import { NetworkNames } from '../shared';

export const SOLIDITY_VERSION = '0.8.9';

export const NETWORKS: Record<
  string,
  {
    chainId: number;
    url: string;
    isLocal?: boolean;
    crossDomainMessenger?: string;
  }
> = {
  [NetworkNames.Local]: {
    chainId: 31337,
    url: 'http://localhost:9545',
    isLocal: true,
    crossDomainMessenger: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
  },
  [NetworkNames.LocalOptimism]: {
    chainId: 17,
    url: 'http://localhost:8545',
    isLocal: true,
    crossDomainMessenger: '0x4200000000000000000000000000000000000007',
  },
  [NetworkNames.Kovan]: {
    chainId: 42,
    url: 'https://kovan.infura.io/v3',
    crossDomainMessenger: '0x4361d0f75a0186c05f971c566dc6bea5957483fd',
  },
  [NetworkNames.KovanOptimism]: {
    chainId: 69,
    url: 'https://kovan-optimistic.etherscan.io',
    crossDomainMessenger: '0x4200000000000000000000000000000000000007',
  },
  [NetworkNames.Gnosis]: {
    chainId: 100,
    url: 'https://rpc.gnosischain.com',
    crossDomainMessenger: '0x6a52b1dbe0293f1ba1bc136b0f8c8f0395f940b9',
  },
  [NetworkNames.GnosisOptimism]: {
    chainId: 300,
    url: 'https://optimism.gnosischain.com',
    crossDomainMessenger: '0x4200000000000000000000000000000000000007',
  },
};
