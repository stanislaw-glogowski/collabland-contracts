import { extendEnvironment } from 'hardhat/config';
import { Envs, Optimism } from '../shared';
import { Helpers } from './classes';

extendEnvironment((hre) => {
  const {
    network: {
      name: networkName,
      config: { optimism: optimismConfig },
    },
  } = hre;
  const { processEnvs } = Envs;

  hre.helpers = new Helpers(hre);

  hre.processEnvs = processEnvs;
  hre.processNetworkEnvs = processEnvs.useNamespace(networkName);

  let layer: Optimism['layer'] = null;
  let contracts: Optimism['contracts'] = {};

  if (optimismConfig) {
    const { l1, l2 } = optimismConfig;

    if (l1) {
      layer = 1;
      contracts = l1;
    } else if (l2) {
      layer = 2;
      contracts = l2;
    }
  }

  hre.optimism = {
    layer, //
    contracts,
  };
});
