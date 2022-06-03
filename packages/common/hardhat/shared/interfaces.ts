export interface OptimismContracts {
  crossDomainMessenger: string;
}

export interface OptimismConfig {
  l1?: OptimismContracts;
  l2?: OptimismContracts;
}

export interface Optimism {
  layer: null | 1 | 2;
  contracts: Partial<OptimismContracts>;
}
