// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Controlled.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20Snapshot.sol";
import "./GovernanceToken.sol";
import "./GovernanceTokenL1.sol";

contract GovernanceTokenL2 is Controlled, GovernanceToken, ERC20Snapshot {
  enum ProposalStatuses {
    Unknown,
    Processed,
    Rejected
  }

  enum VoteTypes {
    Unknown,
    Yes,
    No
  }

  struct Proposal {
    uint256 snapshotId;
    address[] callTo;
    uint256[] callValue;
    bytes[] callData;
    ProposalStatuses status;
    uint256 votingStartsAt;
    uint256 votingEndsAt;
    uint256 votesYesWeight;
    uint256 votesNoWeight;
  }

  uint256 private _votingPeriod;
  uint256 private _proposalCounter;

  mapping(uint256 => Proposal) private _proposals;
  mapping(uint256 => mapping(address => VoteTypes)) private _votes;

  // events

  event Initialized(
    address[] controllers,
    uint256 snapshotWindowLength,
    address crossDomainMessenger,
    uint256 votingPeriod
  );

  event ProposalCreated(
    uint256 proposalId,
    uint256 snapshotId,
    address[] callTo,
    uint256[] callValue,
    bytes[] callData,
    uint256 votingStartsAt,
    uint256 votingEndsAt
  );

  event ProposalProcessed(uint256 proposalId);

  event ProposalRejected(uint256 proposalId);

  event VoteSubmitted(
    uint256 proposalId,
    address account,
    VoteTypes voteType,
    uint256 votesWeight
  );

  // errors

  error AlreadyVoted();
  error CallToIsTheZeroAddress();
  error InsufficientBalance();
  error InvalidEndsIn();
  error InvalidVoteType();
  error InvalidVotingPeriod();
  error ProposalAlreadyProcessed();
  error ProposalNotFound();
  error VotingAlreadyFinished();
  error VotingNotFinished();
  error VotingNotStarted();

  // constructor

  constructor()
    Controlled()
    ERC20Snapshot(ERC20_NAME, ERC20_SYMBOL)
    GovernanceToken()
  {
    //
  }

  // initialize

  function initialize(
    address[] calldata controllers,
    uint256 snapshotWindowLength,
    address crossDomainMessenger,
    uint256 votingPeriod,
    uint256 totalSupply_
  ) external initializer {
    _setCrossDomainMessenger(crossDomainMessenger);

    if (votingPeriod == 0) {
      revert InvalidVotingPeriod();
    }

    _setControllers(controllers);

    _setSnapshotWindowLength(snapshotWindowLength);

    _setCrossDomainMessenger(crossDomainMessenger);

    _votingPeriod = votingPeriod;

    emit Initialized(
      controllers,
      snapshotWindowLength,
      crossDomainMessenger,
      votingPeriod
    );

    _mint(msg.sender, totalSupply_);
  }

  // external functions (views)

  function getProposal(uint256 proposalId)
    external
    view
    returns (Proposal memory)
  {
    return _proposals[proposalId];
  }

  function getVote(uint256 proposalId, address account)
    external
    view
    returns (VoteTypes)
  {
    return _votes[proposalId][account];
  }

  // external functions

  function burn(uint256 amount) external override onlyOwner {
    _burn(msg.sender, amount);
  }

  function createProposal(
    address[] calldata callTo,
    uint256[] calldata callValue,
    bytes[] memory callData,
    uint256 votingStartsIn
  ) external payable onlyController {
    {
      uint256 len = callTo.length;

      if (len == 0 || len != callValue.length || len != callData.length) {
        revert CallToIsTheZeroAddress();
      }

      for (uint256 i; i < len; ) {
        if (callTo[i] == address(0)) {
          revert CallToIsTheZeroAddress();
        }

        unchecked {
          ++i;
        }
      }
    }

    unchecked {
      _proposalCounter++;
    }

    uint256 proposalId = _proposalCounter;
    uint256 now_ = block.timestamp; // solhint-disable-line not-rely-on-time
    uint256 snapshotId = _computeSnapshotId(now_);

    uint256 previousSnapshotId;

    unchecked {
      previousSnapshotId = snapshotId - 1;
    }

    uint256 votingStartsAt = now_ + votingStartsIn;
    uint256 votingEndsAt = votingStartsAt + _votingPeriod;

    _proposals[proposalId].snapshotId = previousSnapshotId;
    _proposals[proposalId].callTo = callTo;
    _proposals[proposalId].callValue = callValue;
    _proposals[proposalId].callData = callData;
    _proposals[proposalId].votingStartsAt = votingStartsAt;
    _proposals[proposalId].votingEndsAt = votingEndsAt;

    emit ProposalCreated(
      proposalId,
      previousSnapshotId,
      callTo,
      callValue,
      callData,
      votingStartsAt,
      votingEndsAt
    );
  }

  function processProposal(uint256 proposalId, uint32 gasLimit)
    external
    onlyController
  {
    Proposal storage proposal = _proposals[proposalId];
    uint256 now_ = block.timestamp; // solhint-disable-line not-rely-on-time

    if (proposal.snapshotId == 0) {
      revert ProposalNotFound();
    }

    if (proposal.votingEndsAt > now_) {
      revert VotingNotFinished();
    }

    if (proposal.status != ProposalStatuses.Unknown) {
      revert ProposalAlreadyProcessed();
    }

    if (proposal.votesYesWeight > proposal.votesNoWeight) {
      _sendCrossDomainMessage(
        abi.encodeWithSelector(
          GovernanceTokenL1.processProposalHandler.selector,
          proposalId,
          proposal.callTo,
          proposal.callValue,
          proposal.callData
        ),
        gasLimit
      );

      proposal.status = ProposalStatuses.Processed;

      emit ProposalProcessed(proposalId);
    } else {
      proposal.status = ProposalStatuses.Rejected;

      emit ProposalRejected(proposalId);
    }
  }

  function submitVote(uint256 proposalId, VoteTypes voteType) external {
    Proposal storage proposal = _proposals[proposalId];
    uint256 now_ = block.timestamp; // solhint-disable-line not-rely-on-time

    if (proposal.snapshotId == 0) {
      revert ProposalNotFound();
    }

    if (proposal.votingStartsAt > now_) {
      revert VotingNotStarted();
    }

    if (proposal.votingEndsAt <= now_) {
      revert VotingAlreadyFinished();
    }

    address account = _msgSender();

    if (_votes[proposalId][account] != VoteTypes.Unknown) {
      revert AlreadyVoted();
    }

    uint256 voteWeight = _balanceOfAt(account, proposal.snapshotId);

    if (voteWeight == 0) {
      revert InsufficientBalance();
    }

    unchecked {
      if (voteType == VoteTypes.Yes) {
        proposal.votesYesWeight += voteWeight;
      } else if (voteType == VoteTypes.No) {
        proposal.votesNoWeight += voteWeight;
      } else {
        revert InvalidVoteType();
      }
    }

    _votes[proposalId][account] = voteType;

    emit VoteSubmitted(proposalId, account, voteType, voteWeight);
  }

  // internal functions

  function _mintHandler(address to, uint256 amount)
    internal
    override(ERC20Snapshot, ERC20)
  {
    ERC20Snapshot._mintHandler(to, amount);
  }

  function _burnHandler(address from, uint256 amount)
    internal
    override(ERC20Snapshot, ERC20)
  {
    ERC20Snapshot._burnHandler(from, amount);
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Snapshot, ERC20) {
    ERC20Snapshot._transferHandler(from, to, amount);
  }
}
