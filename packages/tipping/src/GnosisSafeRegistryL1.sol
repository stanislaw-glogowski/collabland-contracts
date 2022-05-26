// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@gnosis.pm/safe-contracts/contracts/GnosisSafeL2.sol";
import "./GnosisSafeRegistry.sol";

contract GnosisSafeRegistryL1 is GnosisSafeRegistry {
  mapping(address => bool) private _deployedWallets;

  // events

  event Initialized(address crossDomainMessenger);

  event WalletDeployed(
    uint256 messageId,
    address wallet,
    bytes32 salt,
    address[] owners
  );

  // constructor

  constructor() GnosisSafeRegistry() {
    //
  }

  // initialize

  function initialize(address crossDomainMessenger) external initializer {
    _setCrossDomainMessenger(crossDomainMessenger);

    emit Initialized(crossDomainMessenger);
  }

  // external functions (views)

  function isWalletDeployed(address wallet) external view returns (bool) {
    return _deployedWallets[wallet];
  }

  // external functions

  function deployWalletHandler(
    uint256 messageId,
    bytes32 salt,
    address[] calldata owners
  ) external onlyCrossDomainSelfCall {
    _addIncomingMessageId(messageId);

    address wallet;

    emit WalletDeployed(messageId, wallet, salt, owners);
  }
}
