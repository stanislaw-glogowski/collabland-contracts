// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";

abstract contract CrossDomainMessengerWrapper {
  address private _crossDomainMessenger;

  // internal functions (views)

  function _xDomainMessageSender() internal view returns (address result) {
    if (_crossDomainMessenger != address(0)) {
      result = ICrossDomainMessenger(_crossDomainMessenger)
        .xDomainMessageSender();
    }

    return result;
  }

  // internal functions

  function _setCrossDomainMessenger(address crossDomainMessenger) internal {
    if (crossDomainMessenger != address(0)) {
      _crossDomainMessenger = crossDomainMessenger;
    }
  }

  function _sendMessage(
    address _target,
    bytes calldata _message,
    uint32 _gasLimit
  ) internal {
    if (_crossDomainMessenger != address(0)) {
      ICrossDomainMessenger(_crossDomainMessenger).sendMessage(
        _target,
        _message,
        _gasLimit
      );
    }
  }
}
