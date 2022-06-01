// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./CrossDomainSelfBridged.sol";

contract CrossDomainSelfBridgedMock is CrossDomainSelfBridged {
  // events

  event Tested();

  // external functions

  function setCrossDomainMessenger(address crossDomainMessenger) external {
    _setCrossDomainMessenger(crossDomainMessenger);
  }

  function sendCrossDomainMessage(bytes calldata message, uint32 gasLimit)
    external
  {
    _sendCrossDomainMessage(message, gasLimit);
  }

  function testOnlyCrossDomainSelfCall() external onlyCrossDomainSelfCall {
    emit Tested();
  }
}
