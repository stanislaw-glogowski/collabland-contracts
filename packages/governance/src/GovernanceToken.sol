// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/tokens/ERC20CrossDomainSelfBridged.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";

abstract contract GovernanceToken is
  ERC20CrossDomainSelfBridged,
  Initializable
{
  string internal constant ERC20_NAME = "Collab.Land Governance";
  string internal constant ERC20_SYMBOL = "COLL-GOV";

  // constructor

  constructor() Initializable() {
    //
  }

  function burn(uint256 amount) external virtual;
}
