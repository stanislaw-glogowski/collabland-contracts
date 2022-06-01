// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Example.sol";

contract ExampleL1 is Example {
  // events

  event MessageSentToL2(
    address msgSender,
    address txOrigin,
    string message,
    uint32 gasLimit
  );

  event MessageReceivedFromL2(
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

    emit MessageSentToL2(msg.sender, tx.origin, message, gasLimit);
  }

  function updateMessage(string calldata message)
    external
    override
    onlyCrossDomainSelfCall
  {
    emit MessageReceivedFromL2(msg.sender, tx.origin, message);

    _updateMessage(message);
  }
}
