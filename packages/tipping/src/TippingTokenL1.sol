// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./TippingToken.sol";

contract TippingTokenL1 is TippingToken {
  // events

  event Initialized(address crossDomainMessenger);

  // constructor

  constructor() TippingToken() {
    //
  }

  // initialize

  function initialize(address crossDomainMessenger, uint256 totalSupply_)
    external
    initializer
  {
    _setCrossDomainMessenger(crossDomainMessenger);

    emit Initialized(crossDomainMessenger);

    _mint(msg.sender, totalSupply_);
  }
}
