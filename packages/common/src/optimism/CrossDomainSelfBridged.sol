// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";

abstract contract CrossDomainSelfBridged {
  address private _crossDomainMessenger;

  // errors

  error CrossDomainMessengerIsTheZeroAddress();
  error OnlyCrossDomainSelfCall();

  // modifiers

  modifier onlyCrossDomainSelfCall() {
    if (
      msg.sender != _crossDomainMessenger ||
      ICrossDomainMessenger(_crossDomainMessenger).xDomainMessageSender() !=
      address(this)
    ) {
      revert OnlyCrossDomainSelfCall();
    }

    _;
  }

  // internal functions

  function _setCrossDomainMessenger(address crossDomainMessenger) internal {
    _crossDomainMessenger = crossDomainMessenger;
  }

  function _sendCrossDomainMessage(bytes memory message, uint32 gasLimit)
    internal
  {
    if (_crossDomainMessenger == address(0)) {
      revert CrossDomainMessengerIsTheZeroAddress();
    }

    ICrossDomainMessenger(_crossDomainMessenger).sendMessage(
      address(this),
      message,
      gasLimit
    );
  }
}
