import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, read, log },
    helpers: { getAccounts },
    processNetworkEnvs: {
      getEnvAsAddressArray,
      getEnvAsNumber,
      getEnvAsAmount,
    },
    optimism: {
      contracts: { l1, l2 },
    },
  } = hre;

  const [from] = await getAccounts();

  log();

  const INITIAL_SUPPLY = getEnvAsAmount(
    'GovernanceToken.INITIAL_SUPPLY',
    '100000000', // 100,000,000 * 10 ** 18
  );

  // layer 1
  if (l1) {
    if (await read('GovernanceTokenL1', 'initialized')) {
      log('ExampleL1 already initialized');
    } else {
      await execute(
        'GovernanceTokenL1',
        {
          from,
          log: true,
        },
        'initialize',
        l1.crossDomainMessenger,
        INITIAL_SUPPLY,
      );
    }
  }

  // layer 2
  if (l2) {
    if (await read('GovernanceTokenL2', 'initialized')) {
      log('GovernanceTokenL2 already initialized');
    } else {
      const CONTROLLERS = getEnvAsAddressArray(
        'GovernanceToken.CONTROLLERS', //
      );
      const SNAPSHOT_WINDOW_LENGTH = getEnvAsNumber(
        'GovernanceToken.SNAPSHOT_WINDOW_LENGTH',
        24 * 60 * 60, // 86400 sec = 1 day
      );
      const VOTING_PERIOD = getEnvAsNumber(
        'GovernanceToken.VOTING_PERIOD',
        24 * 60 * 60, // 86400 sec = 1 day
      );

      await execute(
        'GovernanceTokenL2',
        {
          from,
          log: true,
        },
        'initialize',
        CONTROLLERS,
        SNAPSHOT_WINDOW_LENGTH,
        l2.crossDomainMessenger,
        VOTING_PERIOD,
        INITIAL_SUPPLY,
      );
    }
  }
};

func.tags = ['initialize'];
func.dependencies = ['create'];

export default func;
