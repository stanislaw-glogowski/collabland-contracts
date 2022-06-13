// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Ownable.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20Basic.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20CrossDomainSelfBridged.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";

abstract contract TippingToken is
  Ownable,
  ERC20Basic,
  ERC20CrossDomainSelfBridged,
  Initializable
{
  // constructor

  constructor()
    Ownable()
    ERC20Basic("Universal Tipping", "UTIP")
    Initializable()
  {
    //
  }

  // external functions

  function burn(uint256 amount) external onlyOwner {
    _burn(msg.sender, amount);
  }

  // internal functions

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
