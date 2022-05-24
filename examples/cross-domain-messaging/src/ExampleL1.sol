// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Example.sol";

contract ExampleL1 is Example {
  // events

  event MessageSentToL2(
    address msgSender,
    address txOrigin,
    address xDomainMessageSender,
    string message,
    uint32 gasLimit
  );

  event MessageReceivedFromL2(
    address msgSender,
    address txOrigin,
    address xDomainMessageSender,
    string message
  );

  // constructor

  constructor() Example() {
    //
  }

  // internal functions

  function _sendMessageHandler(string memory message, uint32 gasLimit)
    internal
    override
  {
    emit MessageSentToL2(
      msg.sender,
      tx.origin,
      _xDomainMessageSender(),
      message,
      gasLimit
    );
  }

  function _setMessageHandler(string memory message) internal override {
    emit MessageReceivedFromL2(
      msg.sender,
      tx.origin,
      _xDomainMessageSender(),
      message
    );
  }
}
