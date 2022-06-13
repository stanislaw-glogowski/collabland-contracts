import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import {
  GnosisSafe,
  GnosisSafeProxy__factory as GnosisSafeProxyFactory,
  GnosisSafeRegistryL2,
  CrossDomainMessengerMock,
  TippingTokenL2,
} from '../typechain';

const {
  constants: { AddressZero },
  utils,
} = ethers;

const {
  randomAddress,
  getSigners,
  deployContract,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomHex32,
} = helpers;

describe('GnosisSafeRegistryL2', () => {
  const totalSupply = 1000000;
  const deploymentCost = 100;

  let paymentToken: TippingTokenL2;
  let gnosisSafe: GnosisSafe;
  let gnosisSafeRegistry: GnosisSafeRegistryL2;
  let crossDomainMessenger: CrossDomainMessengerMock;

  let gateway: SignerWithAddress;
  let account: SignerWithAddress;
  let signers: SignerWithAddress[];

  before(async () => {
    [, gateway, account, ...signers] = await getSigners();

    paymentToken = await deployContract('TippingTokenL2');
    gnosisSafe = await deployContract('GnosisSafe');
    gnosisSafeRegistry = await deployContract('GnosisSafeRegistryL2');
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
            gateway.address,
            gnosisSafe.address,
            paymentToken.address,
            deploymentCost,
          ),
        );

        await processTransaction(
          paymentToken.initialize(
            [gnosisSafeRegistry.address],
            gateway.address,
            crossDomainMessenger.address,
            totalSupply,
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

    it('expect to revert when payment token is the zero address', async () => {
      await expect(
        gnosisSafeRegistry.initialize(
          crossDomainMessenger.address,
          gateway.address,
          gnosisSafe.address,
          AddressZero,
          0,
        ),
      ).revertedWith('WalletDeploymentPaymentTokenIsTheZeroAddress()');
    });

    it('expect to initialize the contract', async () => {
      const { tx } = await processTransaction(
        gnosisSafeRegistry.initialize(
          crossDomainMessenger.address,
          gateway.address,
          gnosisSafe.address,
          paymentToken.address,
          0,
        ),
      );

      await expect(tx)
        .to.emit(gnosisSafeRegistry, 'Initialized')
        .withArgs(
          crossDomainMessenger.address,
          gateway.address,
          gnosisSafe.address,
          paymentToken.address,
          0,
        );
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await gnosisSafeRegistry.initialized()).to.eq(true);

      await expect(
        gnosisSafeRegistry.initialize(
          crossDomainMessenger.address,
          gateway.address,
          gnosisSafe.address,
          paymentToken.address,
          0,
        ),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (views)', () => {
    createBeforeHook();

    describe('computeWalletAddress()', () => {
      it('expect to return correct wallet address', async () => {
        const salt = randomHex32();

        expect(await gnosisSafeRegistry.computeWalletAddress(salt)).to.eq(
          computeWalletAddress(salt),
        );
      });
    });

    describe('computeWalletAddressAndVerifyOwner()', () => {
      it('expect to return correct wallet wallet address and true for gateway', async () => {
        const salt = randomHex32();

        const {
          wallet,
          ownerVerified,
        }: { wallet: string; ownerVerified: boolean } =
          await gnosisSafeRegistry.computeWalletAddressAndVerifyOwner(
            salt,
            gateway.address,
          );

        expect(wallet).to.eq(computeWalletAddress(salt));
        expect(ownerVerified).to.eq(true);
      });

      it('expect to return correct wallet address and false for unknown owner', async () => {
        const salt = randomHex32();

        const {
          wallet,
          ownerVerified,
        }: { wallet: string; ownerVerified: boolean } =
          await gnosisSafeRegistry.computeWalletAddressAndVerifyOwner(
            salt,
            randomAddress(),
          );

        expect(wallet).to.eq(computeWalletAddress(salt));
        expect(ownerVerified).to.eq(false);
      });
    });
  });

  describe('# external functions', () => {
    describe('setWalletDeploymentCost()', () => {
      createBeforeHook();

      it('expect to revert when msg.sender is not the owner', async () => {
        await expect(
          gnosisSafeRegistry.connect(account).setWalletDeploymentCost(5),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to set wallet deployment cost', async () => {
        const cost = 10;

        const { tx } = await processTransaction(
          gnosisSafeRegistry.setWalletDeploymentCost(cost),
        );

        await expect(tx)
          .to.emit(gnosisSafeRegistry, 'WalletDeploymentCostUpdated')
          .withArgs(cost);
      });
    });

    describe('addWalletOwner()', () => {
      const data = {
        wallet: gateway,
        walletOwner: randomAddress(),
        walletWithoutGateway: gateway,
      };

      createBeforeHook();

      before(async () => {
        [data.wallet, data.walletWithoutGateway] = signers;

        await processTransaction(
          gnosisSafeRegistry
            .connect(data.wallet)
            .addWalletOwner(data.walletOwner),
        );
        await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithoutGateway)
            .addWalletOwner(data.walletOwner),
        );
        await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithoutGateway)
            .removeWalletOwner(gateway.address),
        );
      });

      it('expect to revert on zero address owner', async () => {
        await expect(
          gnosisSafeRegistry.addWalletOwner(AddressZero),
        ).revertedWith('WalletOwnerIsTheZeroAddress()');
      });

      it('expect to revert when owner already exists', async () => {
        await expect(
          gnosisSafeRegistry
            .connect(data.wallet)
            .addWalletOwner(data.walletOwner),
        ).revertedWith('WalletOwnerAlreadyExists()');
      });

      it('expect to revert when owner (which is the gateway) already exists', async () => {
        await expect(
          gnosisSafeRegistry.addWalletOwner(gateway.address),
        ).revertedWith('WalletOwnerAlreadyExists()');
      });

      it('expect to add an owner', async () => {
        const owner = randomAddress();

        const { tx } = await processTransaction(
          gnosisSafeRegistry.connect(data.wallet).addWalletOwner(owner),
        );

        await expect(tx)
          .to.emit(gnosisSafeRegistry, 'WalletOwnerAdded')
          .withArgs(data.wallet.address, owner);
      });

      it('expect to add an owner (which is the gateway)', async () => {
        const { tx } = await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithoutGateway)
            .addWalletOwner(gateway.address),
        );

        await expect(tx)
          .to.emit(gnosisSafeRegistry, 'WalletOwnerAdded')
          .withArgs(data.walletWithoutGateway.address, gateway.address);
      });
    });

    describe('removeWalletOwner()', () => {
      const data = {
        wallet: gateway,
        walletOwners: [randomAddress(), randomAddress(), randomAddress()],
        walletWithReAddedGateway: gateway,
        walletWithoutGateway: gateway,
      };

      createBeforeHook();

      before(async () => {
        [
          data.wallet,
          data.walletWithReAddedGateway,
          data.walletWithoutGateway,
        ] = signers;

        for (const owner of data.walletOwners) {
          await processTransaction(
            gnosisSafeRegistry.connect(data.wallet).addWalletOwner(owner),
          );
        }

        await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithReAddedGateway)
            .addWalletOwner(randomAddress()),
        );

        await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithoutGateway)
            .addWalletOwner(randomAddress()),
        );

        await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithReAddedGateway)
            .removeWalletOwner(gateway.address),
        );

        await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithoutGateway)
            .removeWalletOwner(gateway.address),
        );

        await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithReAddedGateway)
            .addWalletOwner(gateway.address),
        );
      });

      it('expect to revert on zero address owner', async () => {
        await expect(
          gnosisSafeRegistry.removeWalletOwner(AddressZero),
        ).revertedWith('WalletOwnerIsTheZeroAddress()');
      });

      it('expect to revert on zero address owner', async () => {
        await expect(
          gnosisSafeRegistry.removeWalletOwner(gateway.address),
        ).revertedWith('OwnerlessWallet()');
      });

      it('expect to revert on unknown owner', async () => {
        await expect(
          gnosisSafeRegistry.removeWalletOwner(randomAddress()),
        ).revertedWith('WalletOwnerDoesntExist()');
      });

      it('expect to revert on unknown owner (which is the gateway)', async () => {
        await expect(
          gnosisSafeRegistry
            .connect(data.walletWithoutGateway)
            .removeWalletOwner(gateway.address),
        ).revertedWith('WalletOwnerDoesntExist()');
      });

      it('expect to remove re-added owner (which is the gateway)', async () => {
        const { tx } = await processTransaction(
          gnosisSafeRegistry
            .connect(data.walletWithReAddedGateway)
            .removeWalletOwner(gateway.address),
        );

        await expect(tx)
          .to.emit(gnosisSafeRegistry, 'WalletOwnerRemoved')
          .withArgs(data.walletWithReAddedGateway.address, gateway.address);
      });

      it('expect to remove first owner', async () => {
        const { tx } = await processTransaction(
          gnosisSafeRegistry
            .connect(data.wallet)
            .removeWalletOwner(data.walletOwners[0]),
        );

        await expect(tx)
          .to.emit(gnosisSafeRegistry, 'WalletOwnerRemoved')
          .withArgs(data.wallet.address, data.walletOwners[0]);
      });

      it('expect to remove last owner', async () => {
        const { tx } = await processTransaction(
          gnosisSafeRegistry
            .connect(data.wallet)
            .removeWalletOwner(data.walletOwners[1]),
        );

        await expect(tx)
          .to.emit(gnosisSafeRegistry, 'WalletOwnerRemoved')
          .withArgs(data.wallet.address, data.walletOwners[1]);
      });

      it('expect to revert when there is only one owner', async () => {
        await expect(
          gnosisSafeRegistry
            .connect(data.wallet)
            .removeWalletOwner(data.walletOwners[2]),
        ).revertedWith('OwnerlessWallet()');
      });
    });

    describe('requestWalletDeployment()', () => {
      const data = {
        salt: randomHex32(),
        wallet: '',
        owners: [randomAddress()],
      };

      createBeforeHook();

      before(async () => {
        data.wallet = computeWalletAddress(data.salt);

        await processTransaction(
          paymentToken.transfer(data.wallet, deploymentCost),
        );
      });

      it('expect to revert when msg.sender is not the wallet', async () => {
        await expect(
          gnosisSafeRegistry.requestWalletDeployment(randomHex32(), 1, 1),
        ).revertedWith('InvalidWalletSalt()');
      });

      it('expect to revert when wallet has no owners', async () => {
        await expect(
          gateway.sendTransaction({
            to: gnosisSafeRegistry.address,
            data: utils.concat([
              gnosisSafeRegistry.interface.encodeFunctionData(
                'requestWalletDeployment',
                [data.salt, deploymentCost, 50000],
              ),
              data.wallet,
            ]),
          }),
        ).revertedWith('NotEnoughWalletOwners()');
      });

      describe('# after adding an owner', () => {
        before(async () => {
          for (const owner of data.owners) {
            await processTransaction(
              gateway.sendTransaction({
                to: gnosisSafeRegistry.address,
                data: utils.concat([
                  gnosisSafeRegistry.interface.encodeFunctionData(
                    'addWalletOwner',
                    [owner],
                  ),
                  data.wallet,
                ]),
              }),
            );
          }
        });

        it('expect to revert when wallet has no owners', async () => {
          await expect(
            gateway.sendTransaction({
              to: gnosisSafeRegistry.address,
              data: utils.concat([
                gnosisSafeRegistry.interface.encodeFunctionData(
                  'requestWalletDeployment',
                  [data.salt, deploymentCost - 1, 50000],
                ),
                data.wallet,
              ]),
            }),
          ).revertedWith('InvalidWalletDeploymentCostLimit()');
        });

        it('expect to send wallet deployment request', async () => {
          const { tx } = await processTransaction(
            gateway.sendTransaction({
              to: gnosisSafeRegistry.address,
              data: utils.concat([
                gnosisSafeRegistry.interface.encodeFunctionData(
                  'requestWalletDeployment',
                  [data.salt, deploymentCost, 50000],
                ),
                data.wallet,
              ]),
            }),
          );

          await expect(tx)
            .to.emit(gnosisSafeRegistry, 'WalletDeploymentRequested')
            .withArgs(data.wallet, data.salt, data.owners, 50000);
        });

        describe('# after removing deployment cost', () => {
          before(async () => {
            await processTransaction(
              gnosisSafeRegistry.setWalletDeploymentCost(0),
            );
          });

          it('expect to send wallet deployment request', async () => {
            const { tx } = await processTransaction(
              gateway.sendTransaction({
                to: gnosisSafeRegistry.address,
                data: utils.concat([
                  gnosisSafeRegistry.interface.encodeFunctionData(
                    'requestWalletDeployment',
                    [data.salt, 0, 50000],
                  ),
                  data.wallet,
                ]),
              }),
            );

            await expect(tx)
              .to.emit(gnosisSafeRegistry, 'WalletDeploymentRequested')
              .withArgs(data.wallet, data.salt, data.owners, 50000);
          });
        });
      });
    });
  });
});
