import { extendEnvironment } from 'hardhat/config';
import { Envs } from '../shared';
import { Helpers } from './classes';

extendEnvironment((hre) => {
  const {
    network: {
      name: networkName,
      config: { optimism },
    },
  } = hre;
  const { processEnvs } = Envs;

  hre.helpers = new Helpers(hre);

  hre.processEnvs = processEnvs;
  hre.processNetworkEnvs = processEnvs.useNamespace(networkName);

  hre.optimism = optimism || {
    contracts: {},
  };
});
