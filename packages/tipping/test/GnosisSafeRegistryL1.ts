import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import {
  GnosisSafe,
  GnosisSafeProxy__factory as GnosisSafeProxyFactory,
  GnosisSafeRegistryL1,
  CrossDomainMessengerMock,
} from '../typechain';

const {
  constants: { AddressZero },
  utils,
} = ethers;

const {
  deployContract,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomAddress,
  randomHex32,
} = helpers;

describe('GnosisSafeRegistryL1', () => {
  let gnosisSafe: GnosisSafe;
  let gnosisSafeRegistry: GnosisSafeRegistryL1;
  let crossDomainMessenger: CrossDomainMessengerMock;

  before(async () => {
    gnosisSafe = await deployContract('GnosisSafe');
    gnosisSafeRegistry = await deployContract('GnosisSafeRegistryL1');
    crossDomainMessenger = await deployContract('CrossDomainMessengerMock');

    await processTransaction(
      crossDomainMessenger.setXDomainMessageSender(gnosisSafeRegistry.address),
    );
  });

  const computeWalletAddress = (salt: string) =>
    utils.getCreate2Address(
      gnosisSafeRegistry.address,
      salt,
      utils.keccak256(
        utils.concat([
          GnosisSafeProxyFactory.bytecode,
          utils.zeroPad(gnosisSafe.address, 32),
        ]),
      ),
    );

  const createBeforeHook = (
    options: {
      initialize?: boolean;
    } = {},
  ) => {
    options = {
      initialize: true,
      ...options,
    };

    before(async () => {
      await revertSnapshot();

      if (options.initialize) {
        await processTransaction(
          gnosisSafeRegistry.initialize(
            crossDomainMessenger.address,
            gnosisSafe.address,
          ),
        );
      }
    });
  };

  after(() => {
    resetSnapshots();
  });

  describe('initialize()', () => {
    createBeforeHook({
      initialize: false,
    });

    it('expect to revert when master copy is the zero address', async () => {
      await expect(
        gnosisSafeRegistry.initialize(
          crossDomainMessenger.address,
          AddressZero,
        ),
      ).revertedWith('WalletMasterCopyIsTheZeroAddress()');
    });

    it('expect to initialize the contract', async () => {
      const { tx } = await processTransaction(
        gnosisSafeRegistry.initialize(
          crossDomainMessenger.address,
          gnosisSafe.address,
        ),
      );

      await expect(tx)
        .to.emit(gnosisSafeRegistry, 'Initialized')
        .withArgs(crossDomainMessenger.address, gnosisSafe.address);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await gnosisSafeRegistry.initialized()).to.eq(true);

      await expect(
        gnosisSafeRegistry.initialize(
          crossDomainMessenger.address,
          gnosisSafe.address,
        ),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (views)', () => {
    let wallet: string;

    createBeforeHook();

    before(async () => {
      const salt = randomHex32();

      wallet = computeWalletAddress(salt);

      await processTransaction(
        crossDomainMessenger.callTarget(
          gnosisSafeRegistry.address,
          gnosisSafeRegistry.interface.encodeFunctionData(
            'deployWalletHandler',
            [salt, [randomAddress()]],
          ),
        ),
      );
    });

    describe('computeWalletAddress()', () => {
      it('expect to return correct wallet address', async () => {
        const salt = randomHex32();

        expect(await gnosisSafeRegistry.computeWalletAddress(salt)).to.eq(
          computeWalletAddress(salt),
        );
      });
    });

    describe('isWalletDeployed()', () => {
      it('expect to true when wallet is deployed', async () => {
        expect(await gnosisSafeRegistry.isWalletDeployed(wallet)).to.eq(true);
      });

      it('expect to false when wallet is not deployed', async () => {
        expect(
          await gnosisSafeRegistry.isWalletDeployed(randomAddress()),
        ).to.eq(false);
      });
    });
  });
});
