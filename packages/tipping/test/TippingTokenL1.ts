import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { TippingTokenL1 } from '../typechain';

const {
  getContractFactory,
  constants: { AddressZero },
} = ethers;

const {
  processDeployment,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomAddress,
} = helpers;

describe('TippingTokenL1', () => {
  const totalSupply = 1000000;

  let tippingToken: TippingTokenL1;

  before(async () => {
    const TippingTokenFactory = await getContractFactory('TippingTokenL1');

    tippingToken = await processDeployment(TippingTokenFactory.deploy());
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
          tippingToken.initialize(AddressZero, totalSupply),
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
      const crossDomainMessenger = randomAddress();

      const { tx } = await processTransaction(
        tippingToken.initialize(crossDomainMessenger, totalSupply),
      );

      expect(tx)
        .to.emit(tippingToken, 'Initialized')
        .withArgs(crossDomainMessenger);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await tippingToken.initialized()).to.eq(true);

      await expect(
        tippingToken.initialize(AddressZero, totalSupply),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (pure)', () => {
    const data = {
      name: 'Universal Tipping',
      symbol: 'UTIP',
    };

    createBeforeHook();

    describe('name()', () => {
      it('expect to return correct name', async () => {
        expect(await tippingToken.name()).to.eq(data.name);
      });
    });

    describe('symbol()', () => {
      it('expect to return correct symbol', async () => {
        expect(await tippingToken.symbol()).to.eq(data.symbol);
      });
    });

    describe('totalSupply()', () => {
      it('expect to return correct total supply', async () => {
        expect(await tippingToken.totalSupply()).to.eq(totalSupply);
      });
    });
  });
});
