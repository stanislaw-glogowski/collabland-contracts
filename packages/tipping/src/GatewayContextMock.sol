// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GatewayContext.sol";

contract GatewayContextMock is GatewayContext {
  // events

  event MsgSender(address msgSender);

  // constructor

  constructor(address _gateway) {
    _setGateway(_gateway);
  }

  // external functions

  function emitMsgSender() external {
    emit MsgSender(_msgSender());
  }
}
