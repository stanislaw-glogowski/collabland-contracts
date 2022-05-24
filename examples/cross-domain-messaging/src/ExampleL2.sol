// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Example.sol";

contract ExampleL2 is Example {
  // events

  event MessageSentToL1(
    address msgSender,
    address txOrigin,
    address xDomainMessageSender,
    string message,
    uint32 gasLimit
  );

  event MessageReceivedFromL1(
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
    emit MessageSentToL1(
      msg.sender,
      tx.origin,
      _xDomainMessageSender(),
      message,
      gasLimit
    );
  }

  function _setMessageHandler(string memory message) internal override {
    emit MessageReceivedFromL1(
      msg.sender,
      tx.origin,
      _xDomainMessageSender(),
      message
    );
  }
}
