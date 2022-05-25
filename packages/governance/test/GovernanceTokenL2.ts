import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers, helpers } from 'hardhat';
import { expect } from 'chai';
import { GovernanceTokenL2, CrossDomainMessengerMock } from '../typechain';
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

describe('GovernanceTokenL2', () => {
  const totalSupply = 1000000;
  const snapshotWindowLength = 20;
  const votingPeriod = 50;
  const gasLimit = 3000000;

  let governanceToken: GovernanceTokenL2;
  let crossDomainMessenger: CrossDomainMessengerMock;
  let deployer: SignerWithAddress;
  let controller: SignerWithAddress;
  let voterA: SignerWithAddress;
  let voterB: SignerWithAddress;

  before(async () => {
    await increaseNextBlockTimestamp();

    [deployer, controller, voterA, voterB] = await getSigners();

    const GovernanceTokenFactory = await getContractFactory(
      'GovernanceTokenL2',
    );

    governanceToken = await processDeployment(GovernanceTokenFactory.deploy());

    const CrossDomainMessengerFactory = await getContractFactory(
      'CrossDomainMessengerMock',
    );

    crossDomainMessenger = await processDeployment(
      CrossDomainMessengerFactory.deploy(governanceToken.address),
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
          governanceToken.initialize(
            [controller.address],
            snapshotWindowLength,
            crossDomainMessenger.address,
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

    it('expect to revert on invalid voting period', async () => {
      await expect(
        governanceToken.initialize([], 1, crossDomainMessenger.address, 0, 0),
      ).revertedWith('InvalidVotingPeriod()');
    });

    it('expect to initialize the contract', async () => {
      const controllers = [randomAddress()];

      const { tx } = await processTransaction(
        governanceToken.initialize(
          controllers,
          1,
          crossDomainMessenger.address,
          1,
          totalSupply,
        ),
      );

      expect(tx).to.emit(governanceToken, 'Initialized').withArgs(controllers);
    });

    it('expect to revert when contract is already initialized', async () => {
      expect(await governanceToken.initialized()).to.eq(true);
      expect(await governanceToken.totalSupply()).to.eq(totalSupply);

      await expect(
        governanceToken.initialize(
          [],
          1,
          crossDomainMessenger.address,
          1,
          totalSupply,
        ),
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
      voteType: VoteTypes.Yes,
      balance: 100,
    };

    createBeforeHook();

    before(async () => {
      await increaseNextBlockTimestamp(snapshotWindowLength + 1); // next snapshot

      await processTransaction(
        governanceToken
          .connect(controller)
          .createProposal([randomAddress()], [0], [[]], 0),
      );

      await processTransaction(
        governanceToken.submitVote(data.proposalId, data.voteType),
      );

      await processTransaction(
        governanceToken.transfer(controller.address, data.balance),
      );
    });

    describe('getProposal()', () => {
      it('expect to return correct proposal', async () => {
        const proposal = await governanceToken.getProposal(data.proposalId);

        expect(proposal.snapshotId).to.eq(data.proposalId);
      });

      it("expect to return empty proposal when it doesn't exist", async () => {
        const proposal = await governanceToken.getProposal(data.proposalId + 1);

        expect(proposal.snapshotId).to.eq(0);
      });
    });

    describe('getVote()', () => {
      it('expect to return correct vote', async () => {
        expect(
          await governanceToken.getVote(data.proposalId, deployer.address),
        ).to.eq(data.voteType);
      });

      it("expect to return undefined vote when it doesn't exist", async () => {
        expect(
          await governanceToken.getVote(data.proposalId, randomAddress()),
        ).to.eq(VoteTypes.Unknown);
      });
    });
  });

  describe('# external functions', () => {
    describe('burn()', () => {
      createBeforeHook();

      it('expect to revert when msg sender is not the owner', async () => {
        await expect(
          governanceToken.connect(controller).burn(100),
        ).revertedWith('MsgSenderIsNotTheOwner()');
      });

      it('expect to burn tokens', async () => {
        const value = 1000;

        const { tx } = await processTransaction(governanceToken.burn(value));

        expect(tx)
          .to.emit(governanceToken, 'Transfer')
          .withArgs(deployer.address, AddressZero, value);
      });
    });

    describe('createProposal()', () => {
      const data = {
        snapshotId: 1,
        proposalId: 1,
        callTo: [randomAddress()],
        callValue: [10],
        callData: [randomHex32()],
        votingStartsIn: 100,
      };

      createBeforeHook();

      before(async () => {
        const timestamp = await increaseNextBlockTimestamp(
          snapshotWindowLength + 1,
        ); // next snapshot

        data.snapshotId = (
          await governanceToken.computeSnapshotId(timestamp)
        ).toNumber();
      });

      it('expect to revert when msg sender is not the controller', async () => {
        await expect(
          governanceToken.createProposal([randomAddress()], [0], [[]], 0),
        ).revertedWith('MsgSenderIsNotTheController()');
      });

      it('expect to revert when call to is the zero address', async () => {
        await expect(
          governanceToken
            .connect(controller)
            .createProposal([AddressZero], [0], [[]], 0),
        ).revertedWith('CallToIsTheZeroAddress()');
      });

      it('expect to revert on empty call', async () => {
        await expect(
          governanceToken.connect(controller).createProposal([], [], [], 0),
        ).revertedWith('CallToIsTheZeroAddress()');
      });

      it('expect to create new proposal', async () => {
        const timestamp = await increaseNextBlockTimestamp();
        const votingStartsAt = timestamp + data.votingStartsIn;
        const votingEndsAt = votingStartsAt + votingPeriod;

        const { tx } = await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal(
              data.callTo,
              data.callValue,
              data.callData,
              data.votingStartsIn,
            ),
        );

        expect(tx)
          .to.emit(governanceToken, 'ProposalCreated')
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
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        expect(tx)
          .to.emit(governanceToken, 'ProposalCreated')
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
          readyToReject: 1,
          readyToProcess: 2,
          rejected: 3,
          processed: 4,
          unfinished: 5,
        },
      };

      createBeforeHook();

      before(async () => {
        await processTransaction(
          governanceToken.transfer(voterA.address, data.balances.voterA),
        );

        await processTransaction(
          governanceToken.transfer(voterB.address, data.balances.voterB),
        );

        await increaseNextBlockTimestamp(snapshotWindowLength + 1); // next snapshot

        // readyToReject
        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        // readyToProcess
        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        // rejected
        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        // processed
        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        await processTransaction(
          governanceToken
            .connect(voterB)
            .submitVote(data.proposalIds.readyToProcess, VoteTypes.Yes),
        );

        await processTransaction(
          governanceToken
            .connect(voterB)
            .submitVote(data.proposalIds.rejected, VoteTypes.No),
        );

        await increaseNextBlockTimestamp(votingPeriod + 1);

        // unfinished
        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        await processTransaction(
          governanceToken
            .connect(controller)
            .processProposal(data.proposalIds.processed, gasLimit),
        );
      });

      it("expect to revert when proposal doesn't exist", async () => {
        await expect(
          governanceToken.connect(controller).processProposal(1000, gasLimit),
        ).revertedWith('ProposalNotFound()');
      });

      it('expect to revert when proposal is not finished yet', async () => {
        await expect(
          governanceToken
            .connect(controller)
            .processProposal(data.proposalIds.unfinished, gasLimit),
        ).revertedWith('VotingNotFinished()');
      });

      it('expect to revert when proposal is already processed', async () => {
        await expect(
          governanceToken
            .connect(controller)
            .processProposal(data.proposalIds.processed, gasLimit),
        ).revertedWith('ProposalAlreadyProcessed()');
      });

      it('expect to process with processed status', async () => {
        const { tx } = await processTransaction(
          governanceToken
            .connect(controller)
            .processProposal(data.proposalIds.readyToProcess, gasLimit),
        );

        expect(tx)
          .to.emit(governanceToken, 'ProposalProcessed')
          .withArgs(
            data.proposalIds.readyToProcess,
            ProposalStatuses.Processed,
            gasLimit,
          );
      });

      it('expect to process with reverted status', async () => {
        const { tx } = await processTransaction(
          governanceToken
            .connect(controller)
            .processProposal(data.proposalIds.readyToReject, gasLimit),
        );

        expect(tx)
          .to.emit(governanceToken, 'ProposalProcessed')
          .withArgs(
            data.proposalIds.readyToReject,
            ProposalStatuses.Rejected,
            gasLimit,
          );
      });

      it('expect to process with rejected status', async () => {
        const { tx } = await processTransaction(
          governanceToken
            .connect(controller)
            .processProposal(data.proposalIds.rejected, gasLimit),
        );

        expect(tx)
          .to.emit(governanceToken, 'ProposalProcessed')
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
          governanceToken.transfer(voterA.address, data.balances.voterA),
        );

        await processTransaction(
          governanceToken.transfer(voterB.address, data.balances.voterB),
        );

        await increaseNextBlockTimestamp(snapshotWindowLength + 1); // next snapshot

        // already finished

        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        await increaseNextBlockTimestamp(votingPeriod + 1);

        // not started

        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 100000000),
        );

        // rejected

        await processTransaction(
          governanceToken
            .connect(controller)
            .createProposal([randomAddress()], [0], [[]], 0),
        );

        await processTransaction(
          governanceToken
            .connect(voterA)
            .submitVote(data.proposalIds.ready, VoteTypes.Yes),
        );
      });

      it("expect to revert when proposal doesn't exist", async () => {
        await expect(
          governanceToken.connect(voterA).submitVote(1000, VoteTypes.Yes),
        ).revertedWith('ProposalNotFound()');
      });

      it('expect to revert when voting is not started yet', async () => {
        await expect(
          governanceToken
            .connect(voterA)
            .submitVote(data.proposalIds.notStarted, VoteTypes.Yes),
        ).revertedWith('VotingNotStarted()');
      });

      it('expect to revert when voting is already finished', async () => {
        await expect(
          governanceToken
            .connect(voterA)
            .submitVote(data.proposalIds.alreadyFinished, VoteTypes.Yes),
        ).revertedWith('VotingAlreadyFinished()');
      });

      it('expect to revert when sender already vote', async () => {
        await expect(
          governanceToken
            .connect(voterA)
            .submitVote(data.proposalIds.ready, VoteTypes.Yes),
        ).revertedWith('AlreadyVoted()');
      });

      it('expect to revert on invalid vote type', async () => {
        await expect(
          governanceToken
            .connect(voterB)
            .submitVote(data.proposalIds.ready, VoteTypes.Unknown),
        ).revertedWith('InvalidVoteType()');
      });

      it('expect to revert on insufficient sender balance', async () => {
        await expect(
          governanceToken
            .connect(controller)
            .submitVote(data.proposalIds.ready, VoteTypes.Yes),
        ).revertedWith('InsufficientBalance()');
      });

      it('expect to submit the vote', async () => {
        const { tx } = await processTransaction(
          governanceToken
            .connect(voterB)
            .submitVote(data.proposalIds.ready, VoteTypes.No),
        );

        expect(tx)
          .to.emit(governanceToken, 'VoteSubmitted')
          .withArgs(
            data.proposalIds.ready,
            voterB.address,
            VoteTypes.No,
            data.balances.voterB,
          );
      });
    });
  });
});
