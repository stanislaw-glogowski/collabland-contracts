// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Ownable.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20Basic.sol";
import "./GovernanceToken.sol";

contract GovernanceTokenL1 is Ownable, GovernanceToken, ERC20Basic {
  enum ResponseStatuses {
    Failed,
    Success
  }

  mapping(uint256 => bool) private _processedProposals;

  // events

  event Initialized(address crossDomainMessenger);

  event ProposalProcessed(
    uint256 proposalId,
    ResponseStatuses[] responseStatuses
  );

  // constructor

  constructor()
    Ownable()
    ERC20Basic(ERC20_NAME, ERC20_SYMBOL)
    GovernanceToken()
  {
    //
  }

  // receive

  receive() external payable {
    //
  }

  // initialize

  function initialize(address crossDomainMessenger, uint256 totalSupply_)
    external
    initializer
  {
    _setCrossDomainMessenger(crossDomainMessenger);

    emit Initialized(crossDomainMessenger);

    _mint(msg.sender, totalSupply_);
  }

  // external functions (views)

  function isProposalProcessed(uint256 proposalId)
    external
    view
    returns (bool)
  {
    return _processedProposals[proposalId];
  }

  // external functions

  function burn(uint256 amount) external override onlyOwner {
    _burn(msg.sender, amount);
  }

  function processProposalHandler(
    uint256 messageId,
    uint256 proposalId,
    address[] calldata callTo,
    uint256[] calldata callValue,
    bytes[] calldata callData
  ) external onlyCrossDomainSelfCall {
    _addIncomingMessageId(messageId);

    uint256 len = callTo.length;

    ResponseStatuses[] memory responseStatuses = new ResponseStatuses[](len);

    for (uint256 i; i < len; ) {
      // solhint-disable-next-line avoid-low-level-calls
      (bool success, ) = callTo[i].call{value: callValue[i]}(callData[i]);

      responseStatuses[i] = success
        ? ResponseStatuses.Success
        : ResponseStatuses.Failed;

      unchecked {
        ++i;
      }
    }

    _processedProposals[proposalId] = true;

    emit ProposalProcessed(proposalId, responseStatuses);
  }

  // internal functions

  function _mintHandler(address to, uint256 amount)
    internal
    override(ERC20Basic, ERC20)
  {
    ERC20Basic._mintHandler(to, amount);
  }

  function _burnHandler(address from, uint256 amount)
    internal
    override(ERC20Basic, ERC20)
  {
    ERC20Basic._burnHandler(from, amount);
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Basic, ERC20) {
    ERC20Basic._transferHandler(from, to, amount);
  }
}
