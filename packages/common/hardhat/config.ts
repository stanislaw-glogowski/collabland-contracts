import { extendConfig } from 'hardhat/config';
import { join } from 'path';
import { getEnvAsBool } from '../utils';

extendConfig((config) => {
  const { root } = config.paths;

  config.paths = {
    ...config.paths,
    sources: join(root, 'src'),
    cache: join(root, '.hardhat/cache'),
    artifacts: join(root, '.hardhat/artifacts'),
  };

  (config as any).gasReporter = {
    enabled: getEnvAsBool('REPORT_GAS'),
    currency: 'USD',
  };
});
