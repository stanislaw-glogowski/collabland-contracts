// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TippingToken.sol";

contract TippingTokenMock is TippingToken {
  // events

  event MsgSender(address msgSender);

  // constructor

  constructor() TippingToken() {
    //
  }

  // external functions

  function emitMsgSender() external {
    emit MsgSender(_msgSender());
  }
}
