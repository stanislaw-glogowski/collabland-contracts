import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    getUnnamedAccounts,
    deployments: { deploy, log },
  } = hre;

  const [from] = await getUnnamedAccounts();

  log();

  await deploy('Gateway', {
    from,
    log: true,
  });

  log();

  await deploy('TippingToken', {
    from,
    log: true,
  });

  log();

  await deploy('WalletManager', {
    from,
    log: true,
  });

  log();
};

func.tags = ['create'];

export default func;
