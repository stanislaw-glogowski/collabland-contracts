// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./ERC20.sol";

contract ERC20Mock is ERC20 {
  mapping(address => uint256) public override balanceOf;

  // constructor

  constructor(uint256 totalSupply_) ERC20("ERC20 Mock", "ERC20-MOCK") {
    _mint(msg.sender, totalSupply_);
  }

  // internal functions

  function _mintHandler(address to, uint256 amount) internal override {
    balanceOf[to] += amount;
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override {
    if (balanceOf[from] < amount) {
      revert AmountExceedsBalance();
    }

    unchecked {
      balanceOf[from] -= amount;
    }

    balanceOf[to] += amount;
  }
}
