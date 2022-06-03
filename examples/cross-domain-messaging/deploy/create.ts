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
      await deploy('ExampleL1', {
        from,
        log: true,
      });
      break;

    case 2:
      await deploy('ExampleL2', {
        from,
        log: true,
      });
      break;
  }
};

func.tags = ['create'];

export default func;
