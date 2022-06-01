// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./ERC20Basic.sol";
import "./ERC20CrossDomainSelfBridged.sol";

contract ERC20CrossDomainSelfBridgedMock is
  ERC20Basic,
  ERC20CrossDomainSelfBridged
{
  // constructor

  constructor(address _crossDomainMessenger, uint256 totalSupply_)
    ERC20Basic("", "")
  {
    _setCrossDomainMessenger(_crossDomainMessenger);

    _mint(msg.sender, totalSupply_);
  }

  // internal functions (views)

  function _balanceOf(address account)
    internal
    view
    override(ERC20Basic, ERC20)
    returns (uint256)
  {
    return ERC20Basic._balanceOf(account);
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
    return ERC20Basic._burnHandler(from, amount);
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override(ERC20Basic, ERC20) {
    return ERC20Basic._transferHandler(from, to, amount);
  }
}
