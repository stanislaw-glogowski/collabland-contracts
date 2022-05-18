import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import {
  WalletManager,
  GnosisSafeL2__factory as GnosisSafeL2Factory,
} from '../typechain';

const {
  getContractFactory,
  constants: { AddressZero },
  utils: { getCreate2Address, keccak256, concat },
} = ethers;

const {
  getSigners,
  processDeployment,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomAddress,
  randomHex32,
} = helpers;

describe('WalletManager', () => {
  const walletSalt = randomHex32();
  let walletAddress: string;
  let walletManager: WalletManager;
  let deployer: SignerWithAddress;
  let gateway: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, gateway, account] = await getSigners();

    const WalletManagerFactory = await getContractFactory('WalletManager');

    walletManager = await processDeployment(WalletManagerFactory.deploy());

    walletAddress = getCreate2Address(
      walletManager.address,
      walletSalt,
      keccak256(GnosisSafeL2Factory.bytecode),
    );
  });

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
        await processTransaction(walletManager.initialize(gateway.address));
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

    it('expect to initialize the contract', async () => {
      const gateway = randomAddress();

      const { tx } = await processTransaction(
        walletManager.initialize(gateway),
      );

      expect(tx).to.emit(walletManager, 'Initialized').withArgs(gateway);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await walletManager.initialized()).to.eq(true);

      await expect(walletManager.initialize(AddressZero)).revertedWith(
        'AlreadyInitialized()',
      );
    });
  });

  describe('# external functions (views)', () => {
    createBeforeHook();

    describe('computeWalletAddress()', () => {
      it('expect to compute correct wallet address', async () => {
        expect(await walletManager.computeWalletAddress(walletSalt)).to.eq(
          walletAddress,
        );
      });
    });

    describe('computeWalletAddressAndVerifyOwner()', () => {
      const data = {
        ownerAdded: randomAddress(),
        ownerRemoved: randomAddress(),
      };

      before(async () => {
        await processTransaction(
          gateway.sendTransaction({
            to: walletManager.address,
            data: concat([
              walletManager.interface.encodeFunctionData('addWalletOwner', [
                data.ownerAdded,
              ]),
              walletAddress,
            ]),
          }),
        );

        await processTransaction(
          gateway.sendTransaction({
            to: walletManager.address,
            data: concat([
              walletManager.interface.encodeFunctionData('addWalletOwner', [
                data.ownerRemoved,
              ]),
              walletAddress,
            ]),
          }),
        );

        await processTransaction(
          gateway.sendTransaction({
            to: walletManager.address,
            data: concat([
              walletManager.interface.encodeFunctionData('removeWalletOwner', [
                data.ownerRemoved,
              ]),
              walletAddress,
            ]),
          }),
        );
      });

      it('expect to compute correct wallet address and verify wallet ownership', async () => {
        let wallet: string;
        let ownerVerified: boolean;

        // WalletOwnerStates.Unknown

        ({ wallet, ownerVerified } =
          await walletManager.computeWalletAddressAndVerifyOwner(
            walletSalt,
            randomAddress(),
          ));

        expect(wallet).to.eq(walletAddress);
        expect(ownerVerified).to.eq(false);

        // WalletOwnerStates.Added

        ({ wallet, ownerVerified } =
          await walletManager.computeWalletAddressAndVerifyOwner(
            walletSalt,
            data.ownerAdded,
          ));

        expect(wallet).to.eq(walletAddress);
        expect(ownerVerified).to.eq(true);

        // WalletOwnerStates.Removed

        ({ wallet, ownerVerified } =
          await walletManager.computeWalletAddressAndVerifyOwner(
            walletSalt,
            data.ownerRemoved,
          ));

        expect(wallet).to.eq(walletAddress);
        expect(ownerVerified).to.eq(false);
      });
    });
  });

  describe('# external functions', () => {
    describe('addWalletOwner()', () => {
      createBeforeHook();

      before(async () => {
        await processTransaction(walletManager.addWalletOwner(account.address));
      });

      it('expect to revert when owner is the zero address', async () => {
        await expect(walletManager.addWalletOwner(AddressZero)).revertedWith(
          'WalletOwnerIsTheZeroAddress()',
        );
      });

      it('expect to revert when owner already exists', async () => {
        await expect(
          walletManager.addWalletOwner(account.address),
        ).revertedWith('WalletOwnerAlreadyExists()');
      });

      it('expect to revert when gateway exists as an owner', async () => {
        await expect(
          walletManager.addWalletOwner(gateway.address),
        ).revertedWith('WalletOwnerAlreadyExists()');
      });

      it('expect to add new wallet owner', async () => {
        const owner = randomAddress();

        const { tx } = await processTransaction(
          walletManager.addWalletOwner(owner),
        );

        expect(tx)
          .to.emit(walletManager, 'WalletOwnerAdded')
          .withArgs(deployer.address, owner);
      });

      describe('# after removing the gateway as an owner', () => {
        before(async () => {
          await processTransaction(
            walletManager.removeWalletOwner(gateway.address),
          );
        });

        it('expect to remove the gateway', async () => {
          const { tx } = await processTransaction(
            walletManager.addWalletOwner(gateway.address),
          );

          expect(tx)
            .to.emit(walletManager, 'WalletOwnerAdded')
            .withArgs(deployer.address, gateway.address);
        });
      });
    });

    describe('removeWalletOwner()', () => {
      createBeforeHook();

      const data = {
        removed: randomAddress(),
      };

      before(async () => {
        await processTransaction(walletManager.addWalletOwner(account.address));
        await processTransaction(walletManager.addWalletOwner(data.removed));
        await processTransaction(walletManager.removeWalletOwner(data.removed));
      });

      it('expect to revert when owner is the zero address', async () => {
        await expect(walletManager.removeWalletOwner(AddressZero)).revertedWith(
          'WalletOwnerIsTheZeroAddress()',
        );
      });

      it('expect to revert on ownerless wallet', async () => {
        await expect(
          gateway.sendTransaction({
            to: walletManager.address,
            data: concat([
              walletManager.interface.encodeFunctionData('removeWalletOwner', [
                gateway.address,
              ]),
              walletAddress,
            ]),
          }),
        ).revertedWith('OwnerlessWallet()');
      });

      it("expect to revert when owner doesn't exist", async () => {
        await expect(
          walletManager.removeWalletOwner(randomAddress()),
        ).revertedWith('WalletOwnerDoesntExist()');
      });

      it('expect to remove the gateway', async () => {
        const { tx } = await processTransaction(
          walletManager.removeWalletOwner(gateway.address),
        );

        expect(tx)
          .to.emit(walletManager, 'WalletOwnerRemoved')
          .withArgs(deployer.address, gateway.address);
      });

      it('expect to remove wallet owner', async () => {
        const { tx } = await processTransaction(
          walletManager.removeWalletOwner(account.address),
        );

        expect(tx)
          .to.emit(walletManager, 'WalletOwnerRemoved')
          .withArgs(deployer.address, account.address);
      });

      it('expect to revert when owner was removed', async () => {
        await expect(
          walletManager.removeWalletOwner(account.address),
        ).revertedWith('WalletOwnerDoesntExist()');
      });

      describe('# after adding the gateway as an owner', () => {
        before(async () => {
          await processTransaction(
            walletManager.addWalletOwner(gateway.address),
          );
        });

        it('expect to remove the gateway', async () => {
          const { tx } = await processTransaction(
            walletManager.removeWalletOwner(gateway.address),
          );

          expect(tx)
            .to.emit(walletManager, 'WalletOwnerRemoved')
            .withArgs(deployer.address, gateway.address);
        });
      });
    });
  });
});
