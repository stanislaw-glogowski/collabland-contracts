import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, log },
    helpers: { getAccounts },
    optimism: {
      contracts: { l1, l2 },
    },
  } = hre;

  const [from] = await getAccounts();

  log();

  // layer 1
  if (l1) {
    await deploy('ExampleL1', {
      from,
      log: true,
    });
  }

  // layer 2
  if (l2) {
    await deploy('ExampleL2', {
      from,
      log: true,
    });
  }
};

func.tags = ['create'];

export default func;
