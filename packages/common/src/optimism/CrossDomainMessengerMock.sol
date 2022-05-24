// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";

contract CrossDomainMessengerMock is ICrossDomainMessenger {
  address private _xDomainMessageSender;

  constructor(address xDomainMessageSender_) {
    _xDomainMessageSender = xDomainMessageSender_;
  }

  // events

  event MessageSent(
    address sender,
    address target,
    bytes message,
    uint256 gasLimit
  );

  // external functions (views)

  function xDomainMessageSender() external view returns (address) {
    return _xDomainMessageSender;
  }

  // external functions

  function setXDomainMessageSender(address xDomainMessageSender_) external {
    _xDomainMessageSender = xDomainMessageSender_;
  }

  function sendMessage(
    address _target,
    bytes calldata _message,
    uint32 _gasLimit
  ) external {
    emit MessageSent(msg.sender, _target, _message, _gasLimit);
  }
}
