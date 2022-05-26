// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/utils/Initializable.sol";
import "./GatewayContext.sol";
import "./IWalletRegistry.sol";
import "./Wallet.sol";

contract WalletRegistry is Initializable, GatewayContext, IWalletRegistry {
  enum WalletOwnerStates {
    Unknown,
    Added,
    Removed
  }

  bytes32 private _walletCreationCodeHash;

  mapping(address => mapping(address => WalletOwnerStates))
    private _walletOwnersStates;

  mapping(address => uint256) private _walletOwnersCounters;

  // errors

  error OwnerlessWallet();
  error WalletOwnerAlreadyExists();
  error WalletOwnerDoesntExist();
  error WalletOwnerIsTheZeroAddress();

  // events

  event Initialized(address gateway);

  event WalletOwnerAdded(address wallet, address owner);

  event WalletOwnerRemoved(address wallet, address owner);

  // constructor

  constructor() Initializable() {
    _walletCreationCodeHash = keccak256(type(Wallet).creationCode);
  }

  // initialize

  function initialize(address gateway) external initializer {
    _setGateway(gateway);

    emit Initialized(gateway);
  }

  // external functions (views)

  function computeWalletAddress(bytes32 walletSalt)
    external
    view
    returns (address)
  {
    return _computeWalletAddress(walletSalt);
  }

  function computeWalletAddressAndVerifyOwner(bytes32 walletSalt, address owner)
    external
    view
    returns (address wallet, bool ownerVerified)
  {
    wallet = _computeWalletAddress(walletSalt);

    WalletOwnerStates walletOwnerState = _walletOwnersStates[wallet][owner];

    if (_isGateway(owner)) {
      ownerVerified =
        walletOwnerState != WalletOwnerStates.Removed ||
        _walletOwnersCounters[wallet] == 0;
    } else {
      ownerVerified = walletOwnerState == WalletOwnerStates.Added;
    }

    return (wallet, ownerVerified);
  }

  // external functions

  function addWalletOwner(address owner) external {
    address wallet = _msgSender();

    if (owner == address(0)) {
      revert WalletOwnerIsTheZeroAddress();
    }

    WalletOwnerStates walletOwnerState = _walletOwnersStates[wallet][owner];

    if (_isGateway(owner)) {
      if (walletOwnerState != WalletOwnerStates.Removed) {
        revert WalletOwnerAlreadyExists();
      }
    } else {
      if (walletOwnerState == WalletOwnerStates.Added) {
        revert WalletOwnerAlreadyExists();
      }

      _walletOwnersCounters[wallet] += 1;
    }

    _walletOwnersStates[wallet][owner] = WalletOwnerStates.Added;

    emit WalletOwnerAdded(wallet, owner);
  }

  function removeWalletOwner(address owner) external {
    address wallet = _msgSender();

    if (owner == address(0)) {
      revert WalletOwnerIsTheZeroAddress();
    }

    WalletOwnerStates walletOwnerState = _walletOwnersStates[wallet][owner];

    if (walletOwnerState == WalletOwnerStates.Unknown) {
      if (_isGateway(owner)) {
        if (_walletOwnersCounters[wallet] == 0) {
          revert OwnerlessWallet();
        }

        _walletOwnersStates[wallet][owner] = WalletOwnerStates.Removed;
      } else {
        revert WalletOwnerDoesntExist();
      }
    } else if (walletOwnerState == WalletOwnerStates.Added) {
      if (!_isGateway(owner)) {
        _walletOwnersCounters[wallet] -= 1;
      }

      _walletOwnersStates[wallet][owner] = WalletOwnerStates.Removed;
    } else {
      revert WalletOwnerDoesntExist();
    }

    emit WalletOwnerRemoved(wallet, owner);
  }

  // private functions (views)

  function _computeWalletAddress(bytes32 walletSalt)
    private
    view
    returns (address)
  {
    bytes32 data = keccak256(
      abi.encodePacked(
        bytes1(0xff),
        address(this),
        walletSalt,
        _walletCreationCodeHash
      )
    );

    return address(uint160(uint256(data)));
  }
}
