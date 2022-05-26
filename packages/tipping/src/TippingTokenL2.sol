// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Controlled.sol";
import "@abridged/collabland-common-contracts/src/utils/Context.sol";
import "./GatewayContext.sol";
import "./TippingToken.sol";

contract TippingTokenL2 is Controlled, GatewayContext, TippingToken {
  // events

  event Initialized(
    address[] controllers,
    address gateway,
    address crossDomainMessenger
  );

  // constructor

  constructor() Controlled() TippingToken() {
    //
  }

  // initialize

  function initialize(
    address[] calldata controllers,
    address gateway,
    address crossDomainMessenger,
    uint256 totalSupply_
  ) external initializer {
    _setControllers(controllers);

    _setGateway(crossDomainMessenger);

    _setCrossDomainMessenger(crossDomainMessenger);

    emit Initialized(controllers, gateway, crossDomainMessenger);

    _mint(msg.sender, totalSupply_);
  }

  // internal functions (views)

  function _msgSender()
    internal
    view
    override(GatewayContext, Context)
    returns (address)
  {
    return GatewayContext._msgSender();
  }
}
