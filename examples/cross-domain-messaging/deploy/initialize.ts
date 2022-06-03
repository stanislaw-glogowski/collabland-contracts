import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, read, log },
    helpers: { getAccounts },
    optimism: {
      layer,
      contracts: { crossDomainMessenger },
    },
  } = hre;

  const [from] = await getAccounts();

  log();

  switch (layer) {
    case 1:
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
          crossDomainMessenger,
        );
      }
      break;

    case 2:
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
          crossDomainMessenger,
        );
      }
      break;
  }
};

func.tags = ['initialize'];
func.dependencies = ['create'];

export default func;
