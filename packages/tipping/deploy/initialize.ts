import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {
    deployments: { execute, read, log, get },
    helpers: { getAccounts },
    processNetworkEnvs: {
      getEnvAsNumber,
      getEnvAsAddress,
      getEnvAsAddressArray,
      getEnvAsAmount,
    },
    optimism: {
      contracts: { l1, l2 },
    },
  } = hre;

  const [from] = await getAccounts();

  const INITIAL_SUPPLY = getEnvAsAmount(
    'TippingToken.INITIAL_SUPPLY',
    '100000000', // 100,000,000 * 10 ** 18
  );

  // layer 1
  if (l1) {
    log();

    if (await read('TippingTokenL1', 'initialized')) {
      log('TippingTokenL1 already initialized');
    } else {
      await execute(
        'TippingTokenL1',
        {
          from,
          log: true,
        },
        'initialize',
        l1.crossDomainMessenger,
        INITIAL_SUPPLY,
      );
    }

    log();

    if (await read('GnosisSafeRegistryL1', 'initialized')) {
      log('GnosisSafeRegistryL1 already initialized');
    } else {
      const DEFAULT_WALLET_THRESHOLD = getEnvAsNumber(
        'GnosisSafeRegistry.DEFAULT_WALLET_THRESHOLD',
        0,
      );

      await execute(
        'GnosisSafeRegistryL1',
        {
          from,
          log: true,
        },
        'initialize',
        l1.crossDomainMessenger,
        DEFAULT_WALLET_THRESHOLD,
      );
    }
  }

  // layer 1
  if (l2) {
    log();

    const { address: gateway } = await get('Gateway');

    if (await read('TippingTokenL2', 'initialized')) {
      log('TippingTokenL2 already initialized');
    } else {
      const CONTROLLERS = getEnvAsAddressArray(
        'TippingToken.CONTROLLERS', //
        [from],
      );

      await execute(
        'TippingTokenL2',
        {
          from,
          log: true,
        },
        'initialize',
        CONTROLLERS,
        gateway,
        l2.crossDomainMessenger,
        INITIAL_SUPPLY,
      );
    }

    if (await read('GnosisSafeRegistryL2', 'initialized')) {
      log('GnosisSafeRegistryL2 already initialized');
    } else {
      const { address: tippingToken } = await get('TippingTokenL2');

      const WALLET_DEPLOYMENT_PAYMENT_TOKEN = getEnvAsAddress(
        'GnosisSafeRegistry.CONTROLLERS',
        tippingToken,
      );
      const WALLET_DEPLOYMENT_COST = getEnvAsAmount(
        'GnosisSafeRegistry.WALLET_DEPLOYMENT_COST',
        '100', // 100 * 10 ** 18
      );

      await execute(
        'GnosisSafeRegistryL2',
        {
          from,
          log: true,
        },
        'initialize',
        l2.crossDomainMessenger,
        gateway,
        WALLET_DEPLOYMENT_PAYMENT_TOKEN,
        WALLET_DEPLOYMENT_COST,
      );
    }

    log();

    if (await read('Gateway', 'initialized')) {
      log('Gateway already initialized');
    } else {
      const { address: walletRegistry } = await get('GnosisSafeRegistryL2');

      const CONTROLLERS = getEnvAsAddressArray(
        'Gateway.CONTROLLERS', //
        [from],
      );

      await execute(
        'Gateway',
        {
          from,
          log: true,
        },
        'initialize',
        walletRegistry,
        CONTROLLERS,
      );
    }
  }
};

func.tags = ['initialize'];
func.dependencies = ['create'];

export default func;
