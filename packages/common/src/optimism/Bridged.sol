// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";

abstract contract Bridged {
  address private _crossDomainMessenger;
  uint256 private _outgoingMessageCounter;
  mapping(uint256 => bool) private _incomingMessages;

  // errors

  error IncomingMessagesAlreadyExists();
  error CrossDomainMessengerIsTheZeroAddress();

  // internal functions (views)

  function _xDomainMessageSender() internal view returns (address result) {
    if (msg.sender == _crossDomainMessenger) {
      result = ICrossDomainMessenger(_crossDomainMessenger)
        .xDomainMessageSender();
    }

    return result;
  }

  // internal functions

  function _setCrossDomainMessenger(address crossDomainMessenger) internal {
    _crossDomainMessenger = crossDomainMessenger;
  }

  function _addIncomingMessageId(uint256 messageId) internal {
    if (_incomingMessages[messageId]) {
      revert IncomingMessagesAlreadyExists();
    }

    _incomingMessages[messageId] = true;
  }

  function _incOutgoingMessageCounter() internal returns (uint256) {
    return ++_outgoingMessageCounter;
  }

  function _sendMessage(
    address target,
    bytes memory message,
    uint32 gasLimit
  ) internal {
    if (_crossDomainMessenger == address(0)) {
      revert CrossDomainMessengerIsTheZeroAddress();
    }

    ICrossDomainMessenger(_crossDomainMessenger).sendMessage(
      target,
      message,
      gasLimit
    );
  }
}
