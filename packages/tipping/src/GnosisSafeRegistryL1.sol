// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@gnosis.pm/safe-contracts/contracts/GnosisSafeL2.sol";
import "./GnosisSafeRegistry.sol";

contract GnosisSafeRegistryL1 is GnosisSafeRegistry {
  uint256 private _defaultWalletThreshold;
  mapping(address => bool) private _deployedWallets;

  // events

  event Initialized(
    address crossDomainMessenger,
    uint256 defaultWalletThreshold
  );

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

  function initialize(
    address crossDomainMessenger,
    uint256 defaultWalletThreshold
  ) external initializer {
    _setCrossDomainMessenger(crossDomainMessenger);

    _defaultWalletThreshold = defaultWalletThreshold;

    emit Initialized(crossDomainMessenger, defaultWalletThreshold);
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

    GnosisSafeL2 wallet = new GnosisSafeL2{salt: salt}();

    wallet.setup(
      owners,
      _defaultWalletThreshold,
      address(0), // to
      new bytes(0), // data
      address(0), // fallbackHandler
      address(0), // paymentToken
      0, // payment
      payable(address(0)) // paymentReceiver
    );

    emit WalletDeployed(messageId, address(wallet), salt, owners);
  }
}
