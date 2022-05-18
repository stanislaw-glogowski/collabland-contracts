import { extendEnvironment } from 'hardhat/config';
import { Helpers } from './Helpers';
import { bindObjectMethods } from '../utils';

extendEnvironment((hre) => {
  hre.helpers = bindObjectMethods(new Helpers(hre));
});
