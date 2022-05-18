// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-contracts-common/src/access/Controlled.sol";
import "@abridged/collabland-contracts-common/src/tokens/ERC20.sol";
import "@abridged/collabland-contracts-common/src/utils/Initializable.sol";

contract GovernanceToken is Controlled, ERC20, Initializable {
  enum ProposalStatuses {
    Unknown,
    Completed,
    Reverted,
    Rejected
  }

  enum VoteTypes {
    Unknown,
    Yes,
    No
  }

  struct Settings {
    uint256 snapshotWindowLength;
    uint256 votingPeriod;
  }

  struct BalanceSnapshot {
    uint256 snapshotId;
    uint256 balance;
  }

  struct Proposal {
    uint256 snapshotId;
    address callTo;
    uint256 callValue;
    bytes callData;
    ProposalStatuses status;
    uint256 votingStartsAt;
    uint256 votingEndsAt;
    uint256 votesYesWeight;
    uint256 votesNoWeight;
  }

  Settings private _settings;
  uint256 private _proposalCounter;
  uint256 private _snapshotBaseTimestamp;

  mapping(address => BalanceSnapshot[]) private _balanceSnapshots;
  mapping(uint256 => Proposal) private _proposals;
  mapping(uint256 => mapping(address => VoteTypes)) private _votes;

  // events

  event Initialized(
    address[] controllers,
    uint256 snapshotWindowLength,
    uint256 votingPeriod
  );

  event ProposalCreated(
    uint256 proposalId,
    uint256 snapshotId,
    address callTo,
    uint256 callValue,
    bytes callData,
    uint256 votingStartsAt,
    uint256 votingEndsAt
  );

  event ProposalProcessed(uint256 proposalId, ProposalStatuses status);

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
  error InvalidSnapshotWindowLength();
  error InvalidTotalSupply();
  error InvalidVoteType();
  error InvalidVotingPeriod();
  error ProposalAlreadyProcessed();
  error ProposalCallFailed();
  error ProposalNotFound();
  error VotingAlreadyFinished();
  error VotingNotFinished();
  error VotingNotStarted();

  // constructor

  constructor()
    Controlled()
    ERC20("Collab.Land Governance", "COLL-GOV")
    Initializable()
  {
    _snapshotBaseTimestamp = block.timestamp; // solhint-disable-line not-rely-on-time
  }

  // receive

  receive() external payable {
    //
  }

  // initialize

  function initialize(
    address[] calldata controllers,
    uint256 snapshotWindowLength,
    uint256 votingPeriod,
    uint256 totalSupply_
  ) external initializer {
    if (snapshotWindowLength == 0) {
      revert InvalidSnapshotWindowLength();
    }

    if (votingPeriod == 0) {
      revert InvalidVotingPeriod();
    }

    if (totalSupply_ == 0) {
      revert InvalidTotalSupply();
    }

    _setControllers(controllers);

    _settings.snapshotWindowLength = snapshotWindowLength;
    _settings.votingPeriod = votingPeriod;

    emit Initialized(controllers, snapshotWindowLength, votingPeriod);

    _mint(msg.sender, totalSupply_);
  }

  // external functions (views)

  function getSnapshotIdAt(uint256 timestamp) external view returns (uint256) {
    return _getSnapshotIdAt(timestamp);
  }

  function getBalanceOnSnapshot(address account, uint256 snapshotId)
    external
    view
    returns (uint256)
  {
    return _getBalanceOnSnapshot(account, snapshotId);
  }

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

  function balanceOf(address account) external view returns (uint256) {
    uint256 now_ = block.timestamp; // solhint-disable-line not-rely-on-time
    uint256 snapshotId = _getSnapshotIdAt(now_);

    return _getBalanceOnSnapshot(account, snapshotId);
  }

  // external functions

  function createProposal(
    address callTo,
    uint256 callValue,
    bytes calldata callData,
    uint256 votingStartsIn
  ) external payable onlyController {
    if (callTo == address(0)) {
      revert CallToIsTheZeroAddress();
    }

    unchecked {
      _proposalCounter++;
    }

    uint256 proposalId = _proposalCounter;
    uint256 now_ = block.timestamp; // solhint-disable-line not-rely-on-time
    uint256 snapshotId = _getSnapshotIdAt(now_);

    uint256 previousSnapshotId;

    unchecked {
      previousSnapshotId = snapshotId - 1;
    }

    uint256 votingStartsAt = now_ + votingStartsIn;
    uint256 votingEndsAt = votingStartsAt + _settings.votingPeriod;

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

  function processProposal(uint256 proposalId) external {
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

    ProposalStatuses proposalStatus;

    if (proposal.votesYesWeight > proposal.votesNoWeight) {
      // solhint-disable-next-line avoid-low-level-calls
      (bool success, ) = proposal.callTo.call{value: proposal.callValue}(
        proposal.callData
      );

      if (success) {
        proposalStatus = ProposalStatuses.Completed;
      } else {
        proposalStatus = ProposalStatuses.Reverted;
      }
    } else {
      proposalStatus = ProposalStatuses.Rejected;
    }

    proposal.status = proposalStatus;

    emit ProposalProcessed(proposalId, proposalStatus);
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

    uint256 voteWeight = _getBalanceOnSnapshot(account, proposal.snapshotId);

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

  function _mintHandler(address to, uint256 amount) internal override {
    uint256 snapshotId = _getSnapshotIdAt(block.timestamp); // solhint-disable-line not-rely-on-time

    uint256 toBalance = _getBalanceOnSnapshot(to, snapshotId);

    toBalance += amount;

    _updateBalanceSnapshot(to, toBalance, snapshotId);
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override {
    uint256 snapshotId = _getSnapshotIdAt(block.timestamp); // solhint-disable-line not-rely-on-time

    uint256 fromBalance = _getBalanceOnSnapshot(from, snapshotId);
    uint256 toBalance = _getBalanceOnSnapshot(to, snapshotId);

    if (fromBalance < amount) {
      revert AmountExceedsBalance();
    }

    unchecked {
      fromBalance -= amount;
    }

    toBalance += amount;

    _updateBalanceSnapshot(from, fromBalance, snapshotId);
    _updateBalanceSnapshot(to, toBalance, snapshotId);
  }

  // private functions (views)

  function _getSnapshotIdAt(uint256 timestamp)
    private
    view
    returns (uint256 result)
  {
    if (_snapshotBaseTimestamp <= timestamp) {
      unchecked {
        result =
          ((timestamp - _snapshotBaseTimestamp) /
            _settings.snapshotWindowLength) +
          1;
      }
    }

    return result;
  }

  function _getBalanceOnSnapshot(address account, uint256 snapshotId)
    private
    view
    returns (uint256 result)
  {
    uint256 len = _balanceSnapshots[account].length;

    if (len != 0) {
      for (uint256 pos = 1; pos <= len; ) {
        BalanceSnapshot memory balanceSnapshot;

        unchecked {
          balanceSnapshot = _balanceSnapshots[account][len - pos];
        }

        if (balanceSnapshot.snapshotId <= snapshotId) {
          result = balanceSnapshot.balance;
          break;
        }

        unchecked {
          ++pos;
        }
      }
    }

    return result;
  }

  // private functions

  function _updateBalanceSnapshot(
    address account,
    uint256 balance_,
    uint256 snapshotId
  ) private {
    uint256 len = _balanceSnapshots[account].length;

    if (len != 0) {
      uint256 lastIndex;

      unchecked {
        lastIndex = len - 1;
      }

      if (_balanceSnapshots[account][lastIndex].snapshotId == snapshotId) {
        _balanceSnapshots[account][lastIndex].balance = balance_;
        return;
      }
    }

    BalanceSnapshot memory balanceSnapshot;

    balanceSnapshot.snapshotId = snapshotId;
    balanceSnapshot.balance = balance_;

    _balanceSnapshots[account].push(balanceSnapshot);
  }
}
