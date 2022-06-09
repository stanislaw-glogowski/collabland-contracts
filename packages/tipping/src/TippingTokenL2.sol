// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./GatewayContext.sol";
import "./TippingToken.sol";

contract TippingTokenL2 is GatewayContext, TippingToken {
  // events

  event Initialized(
    address[] operators,
    address gateway,
    address crossDomainMessenger
  );

  // constructor

  constructor() TippingToken() {
    //
  }

  // initialize

  function initialize(
    address[] calldata operators,
    address gateway,
    address crossDomainMessenger,
    uint256 totalSupply_
  ) external initializer {
    _setOperators(operators);

    _setGateway(gateway);

    _setCrossDomainMessenger(crossDomainMessenger);

    emit Initialized(operators, gateway, crossDomainMessenger);

    _mint(msg.sender, totalSupply_);
  }

  // internal functions (views)

  function _msgSender()
    internal
    view
    virtual
    override(GatewayContext, Context)
    returns (address)
  {
    return GatewayContext._msgSender();
  }
}
