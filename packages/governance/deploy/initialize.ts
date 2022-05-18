import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import {
  getEnvAsAddressArray,
  getEnvAsAmount,
  getEnvAsNumber,
} from '@abridged/collabland-contracts-common/utils';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, read, log },
    helpers: { getAccounts },
  } = hre;

  if (await read('GovernanceToken', 'initialized')) {
    log('GovernanceToken already initialized');
  } else {
    const [from] = await getAccounts();

    const CONTROLLERS = getEnvAsAddressArray(
      'GovernanceToken.CONTROLLERS', //
    );
    const SNAPSHOT_WINDOW_LENGTH = getEnvAsNumber(
      'GovernanceToken.SNAPSHOT_WINDOW_LENGTH',
      24 * 60 * 60, // 1 day
    );
    const VOTING_PERIOD = getEnvAsNumber(
      'GovernanceToken.VOTING_PERIOD',
      24 * 60 * 60, // 1 day
    );
    const INITIAL_SUPPLY = getEnvAsAmount(
      'GovernanceToken.INITIAL_SUPPLY',
      '100000000', // 100,000,000 * 10 ** 18
    );

    await execute(
      'GovernanceToken',
      {
        from,
        log: true,
      },
      'initialize',
      CONTROLLERS,
      SNAPSHOT_WINDOW_LENGTH,
      VOTING_PERIOD,
      INITIAL_SUPPLY,
    );
  }

  log();
};

func.tags = ['initialize'];
func.dependencies = ['create'];

export default func;
