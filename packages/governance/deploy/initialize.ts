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
      layer,
      contracts: { crossDomainMessenger },
    },
  } = hre;

  const [from] = await getAccounts();

  log();

  const INITIAL_SUPPLY = getEnvAsAmount(
    'GovernanceToken.INITIAL_SUPPLY',
    '100000000', // 100,000,000 * 10 ** 18
  );

  switch (layer) {
    case 1:
      if (await read('GovernanceTokenL1', 'initialized')) {
        log('GovernanceTokenL1 already initialized');
      } else {
        await execute(
          'GovernanceTokenL1',
          {
            from,
            log: true,
          },
          'initialize',
          crossDomainMessenger,
          INITIAL_SUPPLY,
        );
      }
      break;

    case 2:
      if (await read('GovernanceTokenL2', 'initialized')) {
        log('GovernanceTokenL2 already initialized');
      } else {
        const CONTROLLERS = getEnvAsAddressArray(
          'GovernanceToken.CONTROLLERS', //
          [from],
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
          crossDomainMessenger,
          VOTING_PERIOD,
          INITIAL_SUPPLY,
        );
      }
      break;
  }
};

func.tags = ['initialize'];
func.dependencies = ['create'];

export default func;
