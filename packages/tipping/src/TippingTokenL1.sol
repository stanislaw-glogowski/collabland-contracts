// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Ownable.sol";
import "./TippingToken.sol";

contract TippingTokenL1 is Ownable, TippingToken {
  // events

  event Initialized(address crossDomainMessenger);

  // constructor

  constructor() Ownable() TippingToken() {
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
