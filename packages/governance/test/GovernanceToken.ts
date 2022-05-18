import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { GovernanceTokenMock } from '../typechain';
import { ProposalStatuses, VoteTypes } from './constants';

const {
  getContractFactory,
  constants: { AddressZero },
} = ethers;

const {
  getSigners,
  processDeployment,
  processTransaction,
  randomAddress,
  randomHex32,
  resetSnapshots,
  revertSnapshot,
  increaseNextBlockTimestamp,
} = helpers;

describe('GovernanceToken (using mock)', () => {
  const totalSupply = 1000000;
  const snapshotWindowLength = 20;
  const votingPeriod = 50;

  let baseTimestamp: number;
  let governanceTokenMock: GovernanceTokenMock;
  let deployer: SignerWithAddress;
  let controller: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;

  before(async () => {
    baseTimestamp = await increaseNextBlockTimestamp();

    [deployer, controller, voterA, voterB] = await getSigners();

    const GovernanceTokenMockFactory = await getContractFactory(
      'GovernanceTokenMock',
    );

    governanceTokenMock = await processDeployment(
      GovernanceTokenMockFactory.deploy(),
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
          governanceTokenMock.initialize(
            [controller.address],
            snapshotWindowLength,
            votingPeriod,
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

    it('expect to revert on invalid snapshot window length', async () => {
      await expect(governanceTokenMock.initialize([], 0, 0, 0)).revertedWith(
        'InvalidSnapshotWindowLength()',
      );
    });

    it('expect to revert on invalid voting period', async () => {
      await expect(governanceTokenMock.initialize([], 1, 0, 0)).revertedWith(
        'InvalidVotingPeriod()',
      );
    });

    it('expect to revert on invalid total supply', async () => {
      await expect(governanceTokenMock.initialize([], 1, 1, 0)).revertedWith(
        'InvalidTotalSupply()',
      );
    });

    it('expect to initialize the contract', async () => {
      const controllers = [randomAddress()];

      const { tx } = await processTransaction(
        governanceTokenMock.initialize(controllers, 1, 1, totalSupply),
      );

      expect(tx)
        .to.emit(governanceTokenMock, 'Initialized')
        .withArgs(controllers);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await governanceTokenMock.initialized()).to.eq(true);
      expect(await governanceTokenMock.totalSupply()).to.eq(totalSupply);

      await expect(
        governanceTokenMock.initialize([], 1, 1, totalSupply),
      ).revertedWith('AlreadyInitialized()');
    });
  });

  describe('# external functions (pure)', () => {
    const data = {
      name: 'Collab.Land Governance',
      symbol: 'COLL-GOV',
    };

    createBeforeHook({
      initialize: false,
    });

    describe('name()', () => {
      it('expect to return correct name', async () => {
        expect(await governanceTokenMock.name()).to.eq(data.name);
      });
    });

    describe('symbol()', () => {
      it('expect to return correct symbol', async () => {
        expect(await governanceTokenMock.symbol()).to.eq(data.symbol);
      });
    });
  });

  describe('# external functions (views)', () => {
    const data = {
      snapshotId: 2,
      proposalId: 1,
      voteType: VoteTypes.Yes,
      balance: 100,
    };

    createBeforeHook();

    before(async () => {
      await increaseNextBlockTimestamp(snapshotWindowLength + 1); // next snapshot

      await processTransaction(
        governanceTokenMock
          .connect(controller)
          .createProposal(randomAddress(), 0, [], 0),
      );

      await processTransaction(
        governanceTokenMock.submitVote(data.proposalId, data.voteType),
      );

      await processTransaction(
        governanceTokenMock.transfer(controller.address, data.balance),
      );
    });

    describe('getSnapshotIdAt()', () => {
      it('expect to return correct snapshot id', async () => {
        expect(
          await governanceTokenMock.getSnapshotIdAt(
            baseTimestamp + snapshotWindowLength * (data.snapshotId - 1),
          ),
        ).to.eq(data.snapshotId);
      });

      it('expect to return zero on previous than base timestamp', async () => {
        expect(
          await governanceTokenMock.getSnapshotIdAt(baseTimestamp - 1),
        ).to.eq(0);
      });
    });

    describe('getBalanceOnSnapshot()', () => {
      it('expect to return correct balance', async () => {
        expect(
          await governanceTokenMock.getBalanceOnSnapshot(
            controller.address,
            data.snapshotId,
          ),
        ).to.eq(data.balance);
      });

      it('expect to return zero on previous snapshot id', async () => {
        expect(
          await governanceTokenMock.getBalanceOnSnapshot(
            controller.address,
            data.snapshotId - 1,
          ),
        ).to.eq(0);
      });
    });

    describe('getProposal()', () => {
      it('expect to return correct proposal', async () => {
        const proposal = await governanceTokenMock.getProposal(data.proposalId);

        expect(proposal.snapshotId).to.eq(data.proposalId);
      });

      it("expect to return empty proposal when it doesn't exist", async () => {
        const proposal = await governanceTokenMock.getProposal(
          data.proposalId + 1,
        );

        expect(proposal.snapshotId).to.eq(0);
      });
    });

    describe('getVote()', () => {
      it('expect to return correct vote', async () => {
        expect(
          await governanceTokenMock.getVote(data.proposalId, deployer.address),
        ).to.eq(data.voteType);
      });

      it("expect to return undefined vote when it doesn't exist", async () => {
        expect(
          await governanceTokenMock.getVote(data.proposalId, randomAddress()),
        ).to.eq(VoteTypes.Unknown);
      });
    });
  });

  describe('# external functions', () => {
    describe('createProposal()', () => {
      const data = {
        snapshotId: 1,
        proposalId: 1,
        callTo: randomAddress(),
        callValue: 10,
        callData: randomHex32(),
        votingStartsIn: 100,
      };

      createBeforeHook();

      before(async () => {
        const timestamp = await increaseNextBlockTimestamp(
          snapshotWindowLength + 1,
        ); // next snapshot

        data.snapshotId = (
          await governanceTokenMock.getSnapshotIdAt(timestamp)
        ).toNumber();
      });

      it('expect to revert when msg sender is not the controller', async () => {
        await expect(
          governanceTokenMock.createProposal(randomAddress(), 0, [], 0),
        ).revertedWith('MsgSenderIsNotTheController()');
      });

      it('expect to revert when call to is the zero address', async () => {
        await expect(
          governanceTokenMock
            .connect(controller)
            .createProposal(AddressZero, 0, [], 0),
        ).revertedWith('CallToIsTheZeroAddress()');
      });

      it('expect to create new proposal', async () => {
        const timestamp = await increaseNextBlockTimestamp();
        const votingStartsAt = timestamp + data.votingStartsIn;
        const votingEndsAt = votingStartsAt + votingPeriod;

        const { tx } = await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(
              data.callTo,
              data.callValue,
              data.callData,
              data.votingStartsIn,
            ),
        );

        expect(tx)
          .to.emit(governanceTokenMock, 'ProposalCreated')
          .withArgs(
            data.proposalId,
            data.snapshotId,
            data.callTo,
            data.callValue,
            data.callData,
            votingStartsAt,
            votingEndsAt,
          );
      });

      it('expect to create next proposal', async () => {
        const { tx } = await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 0),
        );

        expect(tx)
          .to.emit(governanceTokenMock, 'ProposalCreated')
          .withArgs(data.proposalId + 1);
      });
    });

    describe('processProposal()', () => {
      const data = {
        balances: {
          voterA: 3000,
          voterB: 200,
        },
        proposalIds: {
          completed: 1,
          reverted: 2,
          rejected: 3,
          processed: 4,
          unfinished: 5,
        },
      };

      createBeforeHook();

      before(async () => {
        await processTransaction(
          governanceTokenMock.transfer(voterA.address, data.balances.voterA),
        );

        await processTransaction(
          governanceTokenMock.transfer(voterB.address, data.balances.voterB),
        );

        await increaseNextBlockTimestamp(snapshotWindowLength + 1); // next snapshot

        // completed
        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 0),
        );

        // reverted
        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(governanceTokenMock.address, 0, randomHex32(), 0),
        );

        // rejected
        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 0),
        );

        // processed
        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 0),
        );

        await processTransaction(
          governanceTokenMock
            .connect(voterA)
            .submitVote(data.proposalIds.completed, VoteTypes.Yes),
        );

        await processTransaction(
          governanceTokenMock
            .connect(voterA)
            .submitVote(data.proposalIds.reverted, VoteTypes.Yes),
        );

        await processTransaction(
          governanceTokenMock
            .connect(voterB)
            .submitVote(data.proposalIds.rejected, VoteTypes.No),
        );

        await increaseNextBlockTimestamp(votingPeriod + 1);

        // unfinished
        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 10000),
        );

        await processTransaction(
          governanceTokenMock.processProposal(data.proposalIds.processed),
        );
      });

      it("expect to revert when proposal doesn't exist", async () => {
        await expect(governanceTokenMock.processProposal(1000)).revertedWith(
          'ProposalNotFound()',
        );
      });

      it('expect to revert when proposal is not finished yet', async () => {
        await expect(
          governanceTokenMock.processProposal(data.proposalIds.unfinished),
        ).revertedWith('VotingNotFinished()');
      });

      it('expect to revert when proposal is already processed', async () => {
        await expect(
          governanceTokenMock.processProposal(data.proposalIds.processed),
        ).revertedWith('ProposalAlreadyProcessed()');
      });

      it('expect to process with completed status', async () => {
        const { tx } = await processTransaction(
          governanceTokenMock.processProposal(data.proposalIds.completed),
        );

        expect(tx)
          .to.emit(governanceTokenMock, 'ProposalProcessed')
          .withArgs(data.proposalIds.completed, ProposalStatuses.Completed);
      });

      it('expect to process with reverted status', async () => {
        const { tx } = await processTransaction(
          governanceTokenMock.processProposal(data.proposalIds.reverted),
        );

        expect(tx)
          .to.emit(governanceTokenMock, 'ProposalProcessed')
          .withArgs(data.proposalIds.reverted, ProposalStatuses.Reverted);
      });

      it('expect to process with rejected status', async () => {
        const { tx } = await processTransaction(
          governanceTokenMock.processProposal(data.proposalIds.rejected),
        );

        expect(tx)
          .to.emit(governanceTokenMock, 'ProposalProcessed')
          .withArgs(data.proposalIds.rejected, ProposalStatuses.Rejected);
      });
    });

    describe('submitVote()', () => {
      const data = {
        balances: {
          voterA: 3000,
          voterB: 200,
        },
        proposalIds: {
          alreadyFinished: 1,
          notStarted: 2,
          ready: 3,
        },
      };

      createBeforeHook();

      before(async () => {
        await processTransaction(
          governanceTokenMock.transfer(voterA.address, data.balances.voterA),
        );

        await processTransaction(
          governanceTokenMock.transfer(voterB.address, data.balances.voterB),
        );

        await increaseNextBlockTimestamp(snapshotWindowLength + 1); // next snapshot

        // already finished

        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 0),
        );

        await increaseNextBlockTimestamp(votingPeriod + 1);

        // not started

        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 100000000),
        );

        // rejected

        await processTransaction(
          governanceTokenMock
            .connect(controller)
            .createProposal(randomAddress(), 0, [], 0),
        );

        await processTransaction(
          governanceTokenMock
            .connect(voterA)
            .submitVote(data.proposalIds.ready, VoteTypes.Yes),
        );
      });

      it("expect to revert when proposal doesn't exist", async () => {
        await expect(
          governanceTokenMock.connect(voterA).submitVote(1000, VoteTypes.Yes),
        ).revertedWith('ProposalNotFound()');
      });

      it('expect to revert when voting is not started yet', async () => {
        await expect(
          governanceTokenMock
            .connect(voterA)
            .submitVote(data.proposalIds.notStarted, VoteTypes.Yes),
        ).revertedWith('VotingNotStarted()');
      });

      it('expect to revert when voting is already finished', async () => {
        await expect(
          governanceTokenMock
            .connect(voterA)
            .submitVote(data.proposalIds.alreadyFinished, VoteTypes.Yes),
        ).revertedWith('VotingAlreadyFinished()');
      });

      it('expect to revert when sender already vote', async () => {
        await expect(
          governanceTokenMock
            .connect(voterA)
            .submitVote(data.proposalIds.ready, VoteTypes.Yes),
        ).revertedWith('AlreadyVoted()');
      });

      it('expect to revert on invalid vote type', async () => {
        await expect(
          governanceTokenMock
            .connect(voterB)
            .submitVote(data.proposalIds.ready, VoteTypes.Unknown),
        ).revertedWith('InvalidVoteType()');
      });

      it('expect to revert on insufficient sender balance', async () => {
        await expect(
          governanceTokenMock
            .connect(controller)
            .submitVote(data.proposalIds.ready, VoteTypes.Yes),
        ).revertedWith('InsufficientBalance()');
      });

      it('expect to submit the vote', async () => {
        const { tx } = await processTransaction(
          governanceTokenMock
            .connect(voterB)
            .submitVote(data.proposalIds.ready, VoteTypes.No),
        );

        expect(tx)
          .to.emit(governanceTokenMock, 'VoteSubmitted')
          .withArgs(
            data.proposalIds.ready,
            voterB.address,
            VoteTypes.No,
            data.balances.voterB,
          );
      });
    });
  });

  describe('# internal function (views)', () => {
    describe('_msgSender()', () => {
      createBeforeHook();

      it('expect to emit correct msg sender', async () => {
        const { tx } = await processTransaction(
          governanceTokenMock.connect(controller).emitMsgSender(),
        );

        expect(tx)
          .to.emit(governanceTokenMock, 'MsgSender')
          .withArgs(controller.address);
      });
    });
  });
});
