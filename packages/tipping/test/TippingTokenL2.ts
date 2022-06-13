import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { TippingTokenL2 } from '../typechain';

const {
  constants: { AddressZero },
} = ethers;

const {
  getSigners,
  deployContract,
  processTransaction,
  resetSnapshots,
  revertSnapshot,
  randomAddress,
} = helpers;

describe('TippingTokenL2', () => {
  const totalSupply = 1000000;

  let tippingToken: TippingTokenL2;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;
  let gateway: SignerWithAddress;

  before(async () => {
    [deployer, account, gateway] = await getSigners();

    tippingToken = await deployContract('TippingTokenL2');
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
          tippingToken.initialize(
            [],
            gateway.address,
            AddressZero,
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

    it('expect to initialize the contract', async () => {
      const operators = [randomAddress()];
      const gateway = randomAddress();
      const crossDomainMessenger = randomAddress();

      const { tx } = await processTransaction(
        tippingToken.initialize(
          operators,
          gateway,
          crossDomainMessenger,
          totalSupply,
        ),
      );

      await expect(tx)
        .to.emit(tippingToken, 'Initialized')
        .withArgs(operators, gateway, crossDomainMessenger);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await tippingToken.initialized()).to.eq(true);

      await expect(
        tippingToken.initialize([], AddressZero, AddressZero, totalSupply),
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

  describe('# external functions', () => {
    describe('transfer()', () => {
      createBeforeHook();

      it('expect to transfer tokens', async () => {
        const to = randomAddress();
        const value = 1000;

        const { tx } = await processTransaction(
          tippingToken.transfer(to, value),
        );

        await expect(tx)
          .to.emit(tippingToken, 'Transfer')
          .withArgs(deployer.address, to, value);
      });
    });

    describe('burn()', () => {
      createBeforeHook();

      it('expect to revert when msg sender is not the owner', async () => {
        await expect(tippingToken.connect(account).burn(100)).revertedWith(
          'MsgSenderIsNotTheOwner()',
        );
      });

      it('expect to burn tokens', async () => {
        const value = 1000;

        const { tx } = await processTransaction(tippingToken.burn(value));

        await expect(tx)
          .to.emit(tippingToken, 'Transfer')
          .withArgs(deployer.address, AddressZero, value);
      });
    });
  });
});
