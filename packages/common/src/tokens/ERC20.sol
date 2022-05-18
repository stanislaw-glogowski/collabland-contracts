// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../utils/Context.sol";
import "./IERC20.sol";
import "./IERC20Metadata.sol";

abstract contract ERC20 is IERC20, IERC20Metadata, Context {
  uint256 internal _totalSupply;

  string private _name;

  string private _symbol;

  mapping(address => mapping(address => uint256)) private _allowances;

  // errors

  error AmountExceedsBalance();
  error InsufficientAllowance();
  error MintToTheZeroAddress();
  error SpenderIsTheZeroAddress();
  error TransferToTheZeroAddress();

  // constructor

  constructor(string memory name_, string memory symbol_) {
    _name = name_;
    _symbol = symbol_;
  }

  // external functions (pure)

  function decimals() external pure returns (uint8) {
    return 18;
  }

  // external functions (views)

  function name() external view returns (string memory) {
    return _name;
  }

  function symbol() external view returns (string memory) {
    return _symbol;
  }

  function totalSupply() external view returns (uint256) {
    return _totalSupply;
  }

  function allowance(address owner, address spender)
    external
    view
    returns (uint256)
  {
    return _allowances[owner][spender];
  }

  // external functions

  function approve(address spender, uint256 amount) external returns (bool) {
    if (spender == address(0)) {
      revert SpenderIsTheZeroAddress();
    }

    _approve(_msgSender(), spender, amount);

    return true;
  }

  function transfer(address to, uint256 amount) external returns (bool) {
    _transfer(_msgSender(), to, amount);

    return true;
  }

  function transferMany(address[] calldata to, uint256[] calldata amount)
    external
  {
    address sender = _msgSender();
    uint256 len = to.length;

    for (uint256 i; i < len; ) {
      _transfer(sender, to[i], amount[i]);

      unchecked {
        ++i;
      }
    }
  }

  function transferFrom(
    address from,
    address to,
    uint256 amount
  ) external returns (bool) {
    _spendAllowance(from, _msgSender(), amount);

    _transfer(from, to, amount);

    return true;
  }

  // internal functions

  function _approve(
    address owner,
    address spender,
    uint256 amount
  ) internal virtual {
    _allowances[owner][spender] = amount;

    emit Approval(owner, spender, amount);
  }

  function _spendAllowance(
    address owner,
    address spender,
    uint256 amount
  ) internal virtual {
    uint256 currentAllowance = _allowances[owner][spender];

    if (currentAllowance != type(uint256).max) {
      if (currentAllowance < amount) {
        revert InsufficientAllowance();
      }

      unchecked {
        _approve(owner, spender, currentAllowance - amount);
      }
    }
  }

  function _mint(address to, uint256 amount) internal virtual {
    if (to == address(0)) {
      revert MintToTheZeroAddress();
    }

    _totalSupply += amount;

    _mintHandler(to, amount);

    emit Transfer(address(0), to, amount);
  }

  function _transfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual {
    if (to == address(0)) {
      revert TransferToTheZeroAddress();
    }

    _transferHandler(from, to, amount);

    emit Transfer(from, to, amount);
  }

  function _mintHandler(address to, uint256 amount) internal virtual;

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal virtual;
}
