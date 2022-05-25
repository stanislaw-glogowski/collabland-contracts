import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, log },
    helpers: { getAccounts },
  } = hre;

  const [from] = await getAccounts();

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
};

func.tags = ['create'];

export default func;
