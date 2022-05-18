import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { TippingTokenMock } from '../typechain';

const {
  getContractFactory,
  constants: { AddressZero },
} = ethers;

const {
  getSigners,
  processDeployment,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomAddress,
} = helpers;

describe('TippingToken (using mock)', () => {
  let tippingTokenMock: TippingTokenMock;
  let controller: SignerWithAddress;

  before(async () => {
    [, controller] = await getSigners();

    const TippingTokenMockFactory = await getContractFactory(
      'TippingTokenMock',
    );

    tippingTokenMock = await processDeployment(
      TippingTokenMockFactory.deploy(),
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
        await processTransaction(
          tippingTokenMock.initialize(AddressZero, [controller.address]),
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

    it('expect to initialize the contract', async () => {
      const gateway = randomAddress();
      const controllers = [randomAddress()];

      const { tx } = await processTransaction(
        tippingTokenMock.initialize(gateway, controllers),
      );

      expect(tx)
        .to.emit(tippingTokenMock, 'Initialized')
        .withArgs(gateway, controllers);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await tippingTokenMock.initialized()).to.eq(true);

      await expect(tippingTokenMock.initialize(AddressZero, [])).revertedWith(
        'AlreadyInitialized()',
      );
    });
  });

  describe('# external functions (pure)', () => {
    const data = {
      name: 'Universal Tipping',
      symbol: 'UTIP',
    };

    createBeforeHook({
      initialize: false,
    });

    describe('name()', () => {
      it('expect to return correct name', async () => {
        expect(await tippingTokenMock.name()).to.eq(data.name);
      });
    });

    describe('symbol()', () => {
      it('expect to return correct symbol', async () => {
        expect(await tippingTokenMock.symbol()).to.eq(data.symbol);
      });
    });
  });

  describe('# external function', () => {
    describe('mint()', () => {
      createBeforeHook();

      it('expect to revert when msg.sender is not the controller', async () => {
        await expect(tippingTokenMock.mint(randomAddress(), 0)).revertedWith(
          'MsgSenderIsNotTheController()',
        );
      });

      it('expect to revert on minting to the zero address', async () => {
        await expect(
          tippingTokenMock.connect(controller).mint(AddressZero, 0),
        ).revertedWith('MintToTheZeroAddress()');
      });

      it('expect to mint tokens', async () => {
        const to = randomAddress();
        const amount = 200;

        const { tx } = await processTransaction(
          tippingTokenMock.connect(controller).mint(to, amount),
        );

        expect(tx)
          .to.emit(tippingTokenMock, 'Transfer')
          .withArgs(AddressZero, to, amount);

        expect(await tippingTokenMock.balanceOf(to)).to.eq(amount);

        expect(await tippingTokenMock.totalSupply()).to.eq(amount);
      });
    });

    describe('mintMany()', () => {
      createBeforeHook();

      it('expect to revert when msg.sender is not the controller', async () => {
        await expect(
          tippingTokenMock.mintMany([randomAddress()], [0]),
        ).revertedWith('MsgSenderIsNotTheController()');
      });

      it('expect to mint tokens', async () => {
        const to = randomAddress();
        const amount = 200;

        const { tx } = await processTransaction(
          tippingTokenMock.connect(controller).mintMany([to], [amount]),
        );

        expect(tx)
          .to.emit(tippingTokenMock, 'Transfer')
          .withArgs(AddressZero, to, amount);

        expect(await tippingTokenMock.balanceOf(to)).to.eq(amount);

        expect(await tippingTokenMock.totalSupply()).to.eq(amount);
      });
    });
  });

  describe('# internal function (views)', () => {
    describe('_msgSender()', () => {
      createBeforeHook();

      it('expect to emit correct msg sender', async () => {
        const { tx } = await processTransaction(
          tippingTokenMock.connect(controller).emitMsgSender(),
        );

        expect(tx)
          .to.emit(tippingTokenMock, 'MsgSender')
          .withArgs(controller.address);
      });
    });
  });
});
