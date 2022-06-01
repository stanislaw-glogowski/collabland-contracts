// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@eth-optimism/contracts/libraries/bridge/ICrossDomainMessenger.sol";

contract CrossDomainMessengerMock is ICrossDomainMessenger {
  address private _xDomainMessageSender;

  // events

  event MessageSent(
    address sender,
    address target,
    bytes message,
    uint256 gasLimit
  );

  event TargetCalled(bool success);

  // external functions (views)

  function xDomainMessageSender() external view returns (address) {
    return _xDomainMessageSender;
  }

  // external functions

  function setXDomainMessageSender(address xDomainMessageSender_) external {
    _xDomainMessageSender = xDomainMessageSender_;
  }

  function sendMessage(
    address target,
    bytes calldata message,
    uint32 gasLimit
  ) external {
    emit MessageSent(msg.sender, target, message, gasLimit);
  }

  function callTarget(address target, bytes calldata data) external {
    // solhint-disable-next-line avoid-low-level-calls
    (bool success, ) = target.call(data);

    emit TargetCalled(success);
  }
}
