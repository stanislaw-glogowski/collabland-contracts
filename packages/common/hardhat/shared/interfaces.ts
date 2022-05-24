export interface OptimismContracts {
  crossDomainMessenger: string;
}

export interface Optimism {
  contracts: {
    l1?: OptimismContracts;
    l2?: OptimismContracts;
  };
}
