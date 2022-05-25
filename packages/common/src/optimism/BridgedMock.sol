// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Bridged.sol";

abstract contract BridgedMock is Bridged {
  // events

  event XDomainMessageSender(address value);

  event OutgoingMessageCounter(uint256 value);

  // external functions

  function emitXDomainMessageSender() external {
    emit XDomainMessageSender(_xDomainMessageSender());
  }

  function setCrossDomainMessenger(address crossDomainMessenger) external {
    _setCrossDomainMessenger(crossDomainMessenger);
  }

  function addIncomingMessageId(uint256 messageId) external {
    _addIncomingMessageId(messageId);
  }

  function incOutgoingMessageCounter() external {
    emit OutgoingMessageCounter(_incOutgoingMessageCounter());
  }

  function sendMessage(
    address target,
    bytes calldata message,
    uint32 gasLimit
  ) external {
    _sendMessage(target, message, gasLimit);
  }
}
