import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import {
  Gateway,
  GatewayContextMock,
  WalletRegistry,
  GnosisSafeL2__factory as GnosisSafeL2Factory,
} from '../typechain';

const {
  constants: { AddressZero },
  utils: { getCreate2Address, keccak256 },
} = ethers;

const {
  getSigners,
  deployContract,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomHex32,
} = helpers;

describe('Gateway', () => {
  const walletSalt = randomHex32();
  let walletAddress: string;
  let walletRegistry: WalletRegistry;
  let gateway: Gateway;
  let gatewayContext: GatewayContextMock;
  let controller: SignerWithAddress;
  let account: SignerWithAddress;
  let signers: SignerWithAddress[];

  before(async () => {
    [, controller, account, ...signers] = await getSigners();

    gateway = await deployContract('Gateway');

    gatewayContext = await deployContract(
      'GatewayContextMock',
      gateway.address,
    );

    walletRegistry = await deployContract('WalletRegistry');

    walletAddress = getCreate2Address(
      walletRegistry.address,
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
        await processTransaction(walletRegistry.initialize(gateway.address));

        await processTransaction(
          gateway.initialize(walletRegistry.address, [controller.address]),
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

    it('expect to revert when wallet registry is the zero address', async () => {
      await expect(gateway.initialize(AddressZero, [AddressZero])).revertedWith(
        'WalletRegistryIsTheZeroAddress()',
      );
    });

    it('expect to initialize the contract', async () => {
      const { tx } = await processTransaction(
        gateway.initialize(walletRegistry.address, [controller.address]),
      );

      expect(tx)
        .to.emit(gateway, 'Initialized')
        .withArgs(walletRegistry.address, [controller.address]);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await gateway.initialized()).to.eq(true);

      await expect(gateway.initialize(AddressZero, [AddressZero])).revertedWith(
        'AlreadyInitialized()',
      );
    });
  });

  describe('# external functions', () => {
    createBeforeHook();

    let removedAccount: SignerWithAddress;

    before(async () => {
      [removedAccount] = signers;

      await processTransaction(
        gateway
          .connect(controller)
          .forwardWalletCalls(
            walletSalt,
            [
              walletRegistry.address,
              walletRegistry.address,
              walletRegistry.address,
            ],
            [
              walletRegistry.interface.encodeFunctionData('addWalletOwner', [
                account.address,
              ]),
              walletRegistry.interface.encodeFunctionData('addWalletOwner', [
                removedAccount.address,
              ]),
              walletRegistry.interface.encodeFunctionData('removeWalletOwner', [
                removedAccount.address,
              ]),
            ],
          ),
      );
    });

    describe('forwardWalletCall()', () => {
      it('expect to revert when msg.sender is not the wallet owner', async () => {
        await expect(
          gateway.forwardWalletCall(walletSalt, AddressZero, []),
        ).revertedWith('MsgSenderIsNotTheWalletOwner()');
      });

      it('expect to revert when msg.sender is the removed account', async () => {
        await expect(
          gateway
            .connect(removedAccount)
            .forwardWalletCall(walletSalt, AddressZero, []),
        ).revertedWith('MsgSenderIsNotTheWalletOwner()');
      });

      it('expect to revert when on call to the zero address', async () => {
        await expect(
          gateway
            .connect(controller)
            .forwardWalletCall(walletSalt, AddressZero, []),
        ).revertedWith('CallToIsTheZeroAddress()');
      });

      it('expect to revert when on self call', async () => {
        await expect(
          gateway
            .connect(controller)
            .forwardWalletCall(walletSalt, gateway.address, []),
        ).revertedWith('CallToSelfIsForbidden()');
      });

      it('expect to forward wallet call by the controller', async () => {
        const { tx } = await processTransaction(
          gateway
            .connect(controller)
            .forwardWalletCall(
              walletSalt,
              gatewayContext.address,
              gatewayContext.interface.encodeFunctionData('emitMsgSender'),
            ),
        );

        expect(tx).to.emit(walletRegistry, 'MsgSender').withArgs(walletAddress);
      });

      it('expect to forward wallet call by the account', async () => {
        const { tx } = await processTransaction(
          gateway
            .connect(account)
            .forwardWalletCall(
              walletSalt,
              gatewayContext.address,
              gatewayContext.interface.encodeFunctionData('emitMsgSender'),
            ),
        );

        expect(tx).to.emit(walletRegistry, 'MsgSender').withArgs(walletAddress);
      });
    });
  });
});
