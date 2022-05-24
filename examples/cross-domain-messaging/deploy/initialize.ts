import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, read, log },
    helpers: { getAccounts },
    optimism: {
      contracts: { l1, l2 },
    },
  } = hre;

  const [from] = await getAccounts();

  log();

  // layer 1
  if (l1) {
    if (await read('ExampleL1', 'initialized')) {
      log('ExampleL1 already initialized');
    } else {
      await execute(
        'ExampleL1',
        {
          from,
          log: true,
        },
        'initialize',
        l1.crossDomainMessenger,
      );
    }
  }

  // layer 2
  if (l2) {
    if (await read('ExampleL2', 'initialized')) {
      log('ExampleL2 already initialized');
    } else {
      await execute(
        'ExampleL2',
        {
          from,
          log: true,
        },
        'initialize',
        l2.crossDomainMessenger,
      );
    }
  }
};

func.tags = ['initialize'];
func.dependencies = ['create'];

export default func;
