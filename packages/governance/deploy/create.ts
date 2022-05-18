import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { deploy, log },
    helpers: { getAccounts },
  } = hre;

  const [from] = await getAccounts();

  log();

  await deploy('GovernanceToken', {
    from,
    log: true,
  });

  log();
};

func.tags = ['create'];

export default func;
