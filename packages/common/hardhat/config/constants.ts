export const SOLIDITY_VERSION = '0.8.9';

export const NETWORKS: {
  name: string;
  chainId: number;
  url: string;
  isLocal?: boolean;
}[] = [
  {
    name: 'local',
    chainId: 31337,
    url: 'http://localhost:9545',
    isLocal: true,
  },
  {
    name: 'local-optimism',
    chainId: 17,
    url: 'http://localhost:8545',
    isLocal: true,
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
