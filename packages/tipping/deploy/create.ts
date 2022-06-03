import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, log },
    helpers: { getAccounts },
    optimism: { layer },
  } = hre;

  const [from] = await getAccounts();

  log();

  switch (layer) {
    case 1:
      await deploy('TippingTokenL1', {
        from,
        log: true,
      });

      log();

      await deploy('GnosisSafeRegistryL1', {
        from,
        log: true,
      });
      break;

    case 2:
      await deploy('TippingTokenL2', {
        from,
        log: true,
      });

      log();

      await deploy('GnosisSafeRegistryL2', {
        from,
        log: true,
      });

      await deploy('Gateway', {
        from,
        log: true,
      });
      break;
  }
};

func.tags = ['create'];

export default func;
