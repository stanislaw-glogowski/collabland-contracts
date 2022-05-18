// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./Context.sol";

contract ContextTokenMock is Context {
  // events

  event MsgSender(address msgSender);

  // constructor

  constructor() {
    //
  }

  // external functions

  function emitMsgSender() external {
    emit MsgSender(_msgSender());
  }
}
