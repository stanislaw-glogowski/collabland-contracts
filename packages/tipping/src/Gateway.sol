// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Controlled.sol";
import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";
import "./IWalletRegistry.sol";

contract Gateway is Controlled, Initializable {
  IWalletRegistry private _walletRegistry;

  // errors

  error CallToIsTheZeroAddress();
  error CallToSelfIsForbidden();
  error MsgSenderIsNotTheWalletOwner();
  error WalletRegistryIsTheZeroAddress();

  // events

  event Initialized(address[] controllers);

  event WalletCallForwarded(
    address wallet,
    address to,
    bytes data,
    bool success,
    bytes response
  );

  // constructor

  constructor() Controlled() Initializable() {
    //
  }

  // initialize

  function initialize(address walletRegistry, address[] calldata controllers)
    external
    initializer
  {
    if (walletRegistry == address(0)) {
      revert WalletRegistryIsTheZeroAddress();
    }

    _walletRegistry = IWalletRegistry(walletRegistry);

    _setControllers(controllers);

    emit Initialized(controllers);
  }

  // external functions

  function forwardWalletCall(
    bytes32 walletSalt,
    address to,
    bytes calldata data
  ) external {
    address wallet = _verifyWalletOwnership(walletSalt, msg.sender);

    _forwardWalletCall(wallet, to, data);
  }

  function forwardWalletCalls(
    bytes32 walletSalt,
    address[] calldata to,
    bytes[] calldata data
  ) external {
    address wallet = _verifyWalletOwnership(walletSalt, msg.sender);

    uint256 len = to.length;

    for (uint256 i; i < len; ) {
      _forwardWalletCall(wallet, to[i], data[i]);

      unchecked {
        ++i;
      }
    }
  }

  // private functions (views)

  function _verifyWalletOwnership(bytes32 walletSalt, address sender)
    private
    view
    returns (address result)
  {
    bool ownerVerified;

    (result, ownerVerified) = _walletRegistry
      .computeWalletAddressAndVerifyOwner(
        walletSalt,
        _hasController(sender) ? address(this) : sender
      );

    if (!ownerVerified) {
      revert MsgSenderIsNotTheWalletOwner();
    }

    return result;
  }

  // private functions

  function _forwardWalletCall(
    address wallet,
    address to,
    bytes memory data
  ) private {
    if (to == address(0)) {
      revert CallToIsTheZeroAddress();
    }

    if (to == address(this)) {
      revert CallToSelfIsForbidden();
    }

    // solhint-disable-next-line avoid-low-level-calls
    (bool success, bytes memory response) = to.call(
      abi.encodePacked(data, wallet)
    );

    emit WalletCallForwarded(wallet, to, data, success, response);
  }
}
