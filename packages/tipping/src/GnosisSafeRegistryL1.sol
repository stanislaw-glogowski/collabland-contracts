// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@gnosis.pm/safe-contracts/contracts/proxies/GnosisSafeProxy.sol";
import "@gnosis.pm/safe-contracts/contracts/GnosisSafe.sol";
import "./GnosisSafeRegistry.sol";

contract GnosisSafeRegistryL1 is GnosisSafeRegistry {
  mapping(address => bool) private _deployedWallets;

  // events

  event Initialized(address crossDomainMessenger, address walletMasterCopy);

  event WalletDeployed(address wallet, bytes32 salt, address[] owners);

  // constructor

  constructor() GnosisSafeRegistry() {
    //
  }

  // initialize

  function initialize(address crossDomainMessenger, address walletMasterCopy)
    external
    initializer
  {
    _setCrossDomainMessenger(crossDomainMessenger);

    _setWalletMasterCopy(walletMasterCopy);

    emit Initialized(crossDomainMessenger, walletMasterCopy);
  }

  // external functions (views)

  function isWalletDeployed(address wallet) external view returns (bool) {
    return _deployedWallets[wallet];
  }

  // external functions

  function deployWalletHandler(bytes32 salt, address[] calldata owners)
    external
    onlyCrossDomainSelfCall
  {
    GnosisSafe wallet = GnosisSafe(
      payable(address(new GnosisSafeProxy{salt: salt}(_walletMasterCopy)))
    );

    wallet.setup(
      owners,
      1, // threshold
      address(0), // to
      new bytes(0), // data
      address(0), // fallbackHandler
      address(0), // paymentToken
      0, // payment
      payable(address(0)) // paymentReceiver
    );

    _deployedWallets[address(wallet)] = true;

    emit WalletDeployed(address(wallet), salt, owners);
  }
}
