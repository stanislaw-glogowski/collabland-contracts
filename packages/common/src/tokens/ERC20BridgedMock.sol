// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";
import "./ERC20Basic.sol";
import "./ERC20Bridged.sol";

contract ERC20BridgedMock is ERC20Basic, ERC20Bridged {
  // constructor

  constructor(uint256 totalSupply_) ERC20Basic("ERC20 Basic Mock", "EBM") {
    _mint(msg.sender, totalSupply_);
  }

  // external functions

  function mint(address to, uint256 amount) external {
    _mint(to, amount);
  }

  function burn(address from, uint256 amount) external {
    _burn(from, amount);
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
