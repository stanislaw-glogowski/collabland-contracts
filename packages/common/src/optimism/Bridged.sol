// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";

abstract contract Bridged {
  address private _crossDomainMessenger;

  // errors

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

  function _sendMessage(
    address _target,
    bytes memory _message,
    uint32 _gasLimit
  ) internal {
    if (_crossDomainMessenger == address(0)) {
      revert CrossDomainMessengerIsTheZeroAddress();
    }

    ICrossDomainMessenger(_crossDomainMessenger).sendMessage(
      _target,
      _message,
      _gasLimit
    );
  }
}
