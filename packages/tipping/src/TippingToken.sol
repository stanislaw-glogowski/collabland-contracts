// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Controlled.sol";
import "@abridged/collabland-common-contracts/src/tokens/ERC20.sol";
import "@abridged/collabland-common-contracts/src/utils/Context.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";
import "./GatewayContext.sol";

contract TippingToken is Controlled, ERC20, Initializable, GatewayContext {
  mapping(address => uint256) private _balances;

  // events

  event Initialized(address gateway, address[] controllers);

  // constructor

  constructor()
    Controlled()
    ERC20("Universal Tipping", "UTIP")
    Initializable()
  {
    //
  }

  // initialize

  function initialize(address gateway, address[] calldata controllers)
    external
    initializer
  {
    _setGateway(gateway);

    _setControllers(controllers);

    emit Initialized(gateway, controllers);
  }

  // external functions (vies)

  function balanceOf(address account) external view override returns (uint256) {
    return _balances[account];
  }

  // external functions

  function mint(address to, uint256 amount) external onlyController {
    _mint(to, amount);
  }

  function mintMany(address[] calldata to, uint256[] calldata amount)
    external
    onlyController
  {
    uint256 len = to.length;

    for (uint256 i; i < len; ) {
      _mint(to[i], amount[i]);

      unchecked {
        ++i;
      }
    }
  }

  // internal functions (views)

  function _msgSender()
    internal
    view
    override(Context, GatewayContext)
    returns (address)
  {
    return GatewayContext._msgSender();
  }

  // internal functions

  function _mintHandler(address to, uint256 amount) internal override {
    _balances[to] += amount;
  }

  function _transferHandler(
    address from,
    address to,
    uint256 amount
  ) internal override {
    if (_balances[from] < amount) {
      revert AmountExceedsBalance();
    }

    unchecked {
      _balances[from] -= amount;
    }

    _balances[to] += amount;
  }
}
