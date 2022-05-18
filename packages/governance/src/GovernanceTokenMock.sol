// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GovernanceToken.sol";

contract GovernanceTokenMock is GovernanceToken {
  // events

  event MsgSender(address msgSender);

  // constructor

  constructor() GovernanceToken() {
    //
  }

  // external functions

  function emitMsgSender() external {
    emit MsgSender(_msgSender());
  }
}
