import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { WalletRegistry, Wallet__factory as WalletFactory } from '../typechain';

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

describe('WalletRegistry', () => {
  const walletSalt = randomHex32();
  let walletAddress: string;
  let walletRegistry: WalletRegistry;
  let deployer: SignerWithAddress;
  let gateway: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, gateway, account] = await getSigners();

    const WalletRegistryFactory = await getContractFactory('WalletRegistry');

    walletRegistry = await processDeployment(WalletRegistryFactory.deploy());

    walletAddress = getCreate2Address(
      walletRegistry.address,
      walletSalt,
      keccak256(WalletFactory.bytecode),
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
        await processTransaction(walletRegistry.initialize(gateway.address));
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
        walletRegistry.initialize(gateway),
      );

      expect(tx).to.emit(walletRegistry, 'Initialized').withArgs(gateway);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await walletRegistry.initialized()).to.eq(true);

      await expect(walletRegistry.initialize(AddressZero)).revertedWith(
        'AlreadyInitialized()',
      );
    });
  });

  describe('# external functions (views)', () => {
    createBeforeHook();

    describe('computeWalletAddress()', () => {
      it('expect to compute correct wallet address', async () => {
        expect(await walletRegistry.computeWalletAddress(walletSalt)).to.eq(
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
            to: walletRegistry.address,
            data: concat([
              walletRegistry.interface.encodeFunctionData('addWalletOwner', [
                data.ownerAdded,
              ]),
              walletAddress,
            ]),
          }),
        );

        await processTransaction(
          gateway.sendTransaction({
            to: walletRegistry.address,
            data: concat([
              walletRegistry.interface.encodeFunctionData('addWalletOwner', [
                data.ownerRemoved,
              ]),
              walletAddress,
            ]),
          }),
        );

        await processTransaction(
          gateway.sendTransaction({
            to: walletRegistry.address,
            data: concat([
              walletRegistry.interface.encodeFunctionData('removeWalletOwner', [
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
          await walletRegistry.computeWalletAddressAndVerifyOwner(
            walletSalt,
            randomAddress(),
          ));

        expect(wallet).to.eq(walletAddress);
        expect(ownerVerified).to.eq(false);

        // WalletOwnerStates.Added

        ({ wallet, ownerVerified } =
          await walletRegistry.computeWalletAddressAndVerifyOwner(
            walletSalt,
            data.ownerAdded,
          ));

        expect(wallet).to.eq(walletAddress);
        expect(ownerVerified).to.eq(true);

        // WalletOwnerStates.Removed

        ({ wallet, ownerVerified } =
          await walletRegistry.computeWalletAddressAndVerifyOwner(
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
        await processTransaction(
          walletRegistry.addWalletOwner(account.address),
        );
      });

      it('expect to revert when owner is the zero address', async () => {
        await expect(walletRegistry.addWalletOwner(AddressZero)).revertedWith(
          'WalletOwnerIsTheZeroAddress()',
        );
      });

      it('expect to revert when owner already exists', async () => {
        await expect(
          walletRegistry.addWalletOwner(account.address),
        ).revertedWith('WalletOwnerAlreadyExists()');
      });

      it('expect to revert when gateway exists as an owner', async () => {
        await expect(
          walletRegistry.addWalletOwner(gateway.address),
        ).revertedWith('WalletOwnerAlreadyExists()');
      });

      it('expect to add new wallet owner', async () => {
        const owner = randomAddress();

        const { tx } = await processTransaction(
          walletRegistry.addWalletOwner(owner),
        );

        expect(tx)
          .to.emit(walletRegistry, 'WalletOwnerAdded')
          .withArgs(deployer.address, owner);
      });

      describe('# after removing the gateway as an owner', () => {
        before(async () => {
          await processTransaction(
            walletRegistry.removeWalletOwner(gateway.address),
          );
        });

        it('expect to remove the gateway', async () => {
          const { tx } = await processTransaction(
            walletRegistry.addWalletOwner(gateway.address),
          );

          expect(tx)
            .to.emit(walletRegistry, 'WalletOwnerAdded')
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
        await processTransaction(
          walletRegistry.addWalletOwner(account.address),
        );
        await processTransaction(walletRegistry.addWalletOwner(data.removed));
        await processTransaction(
          walletRegistry.removeWalletOwner(data.removed),
        );
      });

      it('expect to revert when owner is the zero address', async () => {
        await expect(
          walletRegistry.removeWalletOwner(AddressZero),
        ).revertedWith('WalletOwnerIsTheZeroAddress()');
      });

      it('expect to revert on ownerless wallet', async () => {
        await expect(
          gateway.sendTransaction({
            to: walletRegistry.address,
            data: concat([
              walletRegistry.interface.encodeFunctionData('removeWalletOwner', [
                gateway.address,
              ]),
              walletAddress,
            ]),
          }),
        ).revertedWith('OwnerlessWallet()');
      });

      it("expect to revert when owner doesn't exist", async () => {
        await expect(
          walletRegistry.removeWalletOwner(randomAddress()),
        ).revertedWith('WalletOwnerDoesntExist()');
      });

      it('expect to remove the gateway', async () => {
        const { tx } = await processTransaction(
          walletRegistry.removeWalletOwner(gateway.address),
        );

        expect(tx)
          .to.emit(walletRegistry, 'WalletOwnerRemoved')
          .withArgs(deployer.address, gateway.address);
      });

      it('expect to remove wallet owner', async () => {
        const { tx } = await processTransaction(
          walletRegistry.removeWalletOwner(account.address),
        );

        expect(tx)
          .to.emit(walletRegistry, 'WalletOwnerRemoved')
          .withArgs(deployer.address, account.address);
      });

      it('expect to revert when owner was removed', async () => {
        await expect(
          walletRegistry.removeWalletOwner(account.address),
        ).revertedWith('WalletOwnerDoesntExist()');
      });

      describe('# after adding the gateway as an owner', () => {
        before(async () => {
          await processTransaction(
            walletRegistry.addWalletOwner(gateway.address),
          );
        });

        it('expect to remove the gateway', async () => {
          const { tx } = await processTransaction(
            walletRegistry.removeWalletOwner(gateway.address),
          );

          expect(tx)
            .to.emit(walletRegistry, 'WalletOwnerRemoved')
            .withArgs(deployer.address, gateway.address);
        });
      });
    });
  });
});
