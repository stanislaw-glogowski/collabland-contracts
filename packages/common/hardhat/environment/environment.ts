import { extendEnvironment } from 'hardhat/config';
import { Envs } from '../shared';
import { Helpers } from './Helpers';

extendEnvironment((hre) => {
  const {
    network: { name },
  } = hre;

  hre.helpers = new Helpers(hre);

  const globalEnvs = Envs.getInstance(hre.config.envs);

  hre.envs = globalEnvs.cloneWith(name);
  hre.globalEnvs = globalEnvs;
});
