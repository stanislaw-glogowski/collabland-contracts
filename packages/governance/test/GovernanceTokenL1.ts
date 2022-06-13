import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { GovernanceTokenL1, CrossDomainMessengerMock } from '../typechain';
import { ResponseStatuses } from './constants';

const {
  constants: { AddressZero },
} = ethers;

const {
  getSigners,
  deployContract,
  processTransaction,
  randomAddress,
  resetSnapshots,
  revertSnapshot,
} = helpers;

describe('GovernanceTokenL1', () => {
  const totalSupply = 1000000;

  let governanceToken: GovernanceTokenL1;
  let crossDomainMessenger: CrossDomainMessengerMock;
  let deployer: SignerWithAddress;
  let account: SignerWithAddress;

  before(async () => {
    [deployer, account] = await getSigners();

    governanceToken = await deployContract('GovernanceTokenL1');

    crossDomainMessenger = await deployContract('CrossDomainMessengerMock');

    await processTransaction(
      crossDomainMessenger.setXDomainMessageSender(governanceToken.address),
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
          governanceToken.initialize(crossDomainMessenger.address, totalSupply),
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
      const { tx } = await processTransaction(
        governanceToken.initialize(crossDomainMessenger.address, totalSupply),
      );

      await expect(tx)
        .to.emit(governanceToken, 'Initialized')
        .withArgs(crossDomainMessenger.address);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await governanceToken.initialized()).to.eq(true);
      expect(await governanceToken.totalSupply()).to.eq(totalSupply);

      await expect(
        governanceToken.initialize(crossDomainMessenger.address, totalSupply),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (pure)', () => {
    const data = {
      name: 'Collab.Land Governance',
      symbol: 'COLL-GOV',
    };

    createBeforeHook();

    describe('name()', () => {
      it('expect to return correct name', async () => {
        expect(await governanceToken.name()).to.eq(data.name);
      });
    });

    describe('symbol()', () => {
      it('expect to return correct symbol', async () => {
        expect(await governanceToken.symbol()).to.eq(data.symbol);
      });
    });

    describe('totalSupply()', () => {
      it('expect to return correct total supply', async () => {
        expect(await governanceToken.totalSupply()).to.eq(totalSupply);
      });
    });
  });

  describe('# external functions (views)', () => {
    const data = {
      snapshotId: 2,
      proposalId: 1,
    };

    createBeforeHook();

    before(async () => {
      await processTransaction(
        crossDomainMessenger.callTarget(
          governanceToken.address,
          governanceToken.interface.encodeFunctionData(
            'processProposalHandler',
            [data.proposalId, [randomAddress()], [0], [[]]],
          ),
        ),
      );
    });

    describe('isProposalProcessed()', () => {
      it('expect to return true on processed proposals', async () => {
        const output = await governanceToken.isProposalProcessed(
          data.proposalId,
        );

        expect(output).to.eq(true);
      });

      it('expect to return false on unprocessed proposals', async () => {
        const output = await governanceToken.isProposalProcessed(
          data.proposalId + 1,
        );

        expect(output).to.eq(false);
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
          governanceToken.transfer(to, value),
        );

        await expect(tx)
          .to.emit(governanceToken, 'Transfer')
          .withArgs(deployer.address, to, value);
      });
    });

    describe('burn()', () => {
      createBeforeHook();

      it('expect to revert when msg sender is not the owner', async () => {
        await expect(governanceToken.connect(account).burn(100)).revertedWith(
          'MsgSenderIsNotTheOwner()',
        );
      });

      it('expect to burn tokens', async () => {
        const value = 1000;

        const { tx } = await processTransaction(governanceToken.burn(value));

        await expect(tx)
          .to.emit(governanceToken, 'Transfer')
          .withArgs(deployer.address, AddressZero, value);
      });
    });

    describe('processProposalHandler()', () => {
      const data = {
        proposalId: 8,
        callTo: [randomAddress()],
        callValue: [0],
        callData: [[]],
      };

      createBeforeHook();

      it('expect to revert when msg sender and contract addresses are not the same', async () => {
        await expect(
          governanceToken.processProposalHandler(
            4,
            [randomAddress()],
            [0],
            [[]],
          ),
        ).revertedWith('OnlyCrossDomainSelfCall()');
      });

      it('expect to process the proposal', async () => {
        const { tx } = await processTransaction(
          crossDomainMessenger.callTarget(
            governanceToken.address,
            governanceToken.interface.encodeFunctionData(
              'processProposalHandler',
              [data.proposalId, data.callTo, data.callValue, data.callData],
            ),
          ),
        );

        await expect(tx)
          .to.emit(governanceToken, 'ProposalProcessed')
          .withArgs(data.proposalId, [ResponseStatuses.Success]);
      });
    });
  });
});
