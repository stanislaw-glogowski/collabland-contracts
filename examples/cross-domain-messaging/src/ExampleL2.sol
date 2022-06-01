// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Example.sol";

contract ExampleL2 is Example {
  // events

  event MessageSentToL1(
    address msgSender,
    address txOrigin,
    string message,
    uint32 gasLimit
  );

  event MessageReceivedFromL1(
    address msgSender,
    address txOrigin,
    string message
  );

  // constructor

  constructor() Example() {
    //
  }

  // external functions

  function sendMessage(string calldata message, uint32 gasLimit)
    external
    override
  {
    _sendCrossDomainMessage(
      abi.encodeWithSelector(Example.updateMessage.selector, message),
      gasLimit
    );

    emit MessageSentToL1(msg.sender, tx.origin, message, gasLimit);
  }

  function updateMessage(string calldata message)
    external
    override
    onlyCrossDomainSelfCall
  {
    emit MessageReceivedFromL1(msg.sender, tx.origin, message);

    _updateMessage(message);
  }
}
