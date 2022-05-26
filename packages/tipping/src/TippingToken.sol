// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/tokens/ERC20.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20Basic.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20Bridged.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";

abstract contract TippingToken is ERC20Basic, ERC20Bridged, Initializable {
  // constructor

  constructor() ERC20Basic("Universal Tipping", "UTIP") Initializable() {
    //
  }

  function _mintHandler(address to, uint256 amount)
    internal
    override(ERC20Basic, ERC20)
  {
    return ERC20Basic._mintHandler(to, amount);
  }

  function _burnHandler(address from, uint256 amount)
    internal
    override(ERC20Basic, ERC20)
  {
    ERC20Basic._burnHandler(from, amount);
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Basic, ERC20) {
    ERC20Basic._transferHandler(from, to, amount);
  }
}
