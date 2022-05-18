import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    getUnnamedAccounts,
    deployments: { execute, get, read, log },
  } = hre;

  const [from] = await getUnnamedAccounts();

  const { address: gateway } = await get('Gateway');
  const { address: walletManager } = await get('WalletManager');

  if (await read('Gateway', 'initialized')) {
    log('Gateway already initialized');
  } else {
    const CONTROLLERS = [];

    await execute(
      'Gateway',
      {
        from,
        log: true,
      },
      'initialize',
      walletManager,
      CONTROLLERS,
    );
  }

  log();

  if (await read('TippingToken', 'initialized')) {
    log('TippingToken already initialized');
  } else {
    const CONTROLLERS = [];

    await execute(
      'TippingToken',
      {
        from,
        log: true,
      },
      'initialize',
      gateway,
      CONTROLLERS,
    );
  }

  log();

  if (await read('WalletManager', 'initialized')) {
    log('WalletManager already initialized');
  } else {
    await execute(
      'WalletManager',
      {
        from,
        log: true,
      },
      'initialize',
      gateway,
    );
  }

  log();
};

func.tags = ['initialize'];
func.dependencies = ['create'];

export default func;
