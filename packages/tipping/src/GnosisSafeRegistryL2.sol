// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@abridged/collabland-common-contracts/src/access/Ownable.sol";
import "@abridged/collabland-common-contracts/src/tokens/IERC20.sol";
import "./GnosisSafeRegistry.sol";
import "./GnosisSafeRegistryL1.sol";
import "./GatewayContext.sol";
import "./IWalletRegistry.sol";

contract GnosisSafeRegistryL2 is
  Ownable,
  GnosisSafeRegistry,
  GatewayContext,
  IWalletRegistry
{
  enum OwnerStates {
    Unknown,
    Added,
    Removed
  }

  struct Wallet {
    address[] owners;
    mapping(address => OwnerStates) ownerStates;
    mapping(address => uint256) ownerIndex;
  }

  IERC20 private _walletDeploymentPaymentToken;
  uint256 private _walletDeploymentCost;
  mapping(address => Wallet) private _wallets;

  // errors

  error OwnerlessWallet();
  error WalletOwnerAlreadyExists();
  error WalletOwnerDoesntExist();
  error WalletOwnerIsTheZeroAddress();
  error InvalidWalletSalt();
  error InvalidWalletDeploymentPaymentToken();
  error InvalidWalletDeploymentCost();

  // events

  event Initialized(
    address crossDomainMessenger,
    address gateway,
    address walletDeploymentPaymentToken,
    uint256 walletDeploymentCost
  );

  event WalletOwnerAdded(address wallet, address owner);

  event WalletOwnerRemoved(address wallet, address owner);

  event WalletDeploymentRequested(
    address wallet,
    bytes32 salt,
    address[] owners,
    uint32 gasLimit
  );

  // constructor

  constructor() Ownable() GnosisSafeRegistry() {
    //
  }

  // initialize

  function initialize(
    address crossDomainMessenger,
    address gateway,
    address walletDeploymentPaymentToken,
    uint256 walletDeploymentCost
  ) external initializer {
    _setCrossDomainMessenger(crossDomainMessenger);

    _setGateway(gateway);

    if (walletDeploymentPaymentToken == address(0)) {
      revert InvalidWalletDeploymentPaymentToken();
    }

    if (walletDeploymentCost == 0) {
      revert InvalidWalletDeploymentCost();
    }

    _walletDeploymentPaymentToken = IERC20(walletDeploymentPaymentToken);
    _walletDeploymentCost = walletDeploymentCost;

    emit Initialized(
      crossDomainMessenger,
      gateway,
      walletDeploymentPaymentToken,
      walletDeploymentCost
    );
  }

  // external functions (views)

  function computeWalletAddressAndVerifyOwner(bytes32 walletSalt, address owner)
    external
    view
    returns (address wallet, bool ownerVerified)
  {
    wallet = _computeWalletAddress(walletSalt);

    OwnerStates ownerState = _wallets[wallet].ownerStates[owner];

    if (_isGateway(owner)) {
      ownerVerified =
        ownerState != OwnerStates.Removed ||
        _wallets[wallet].owners.length == 0;
    } else {
      ownerVerified = ownerState == OwnerStates.Added;
    }

    return (wallet, ownerVerified);
  }

  // external functions

  function addWalletOwner(address owner) external {
    address wallet = _msgSender();

    if (owner == address(0)) {
      revert WalletOwnerIsTheZeroAddress();
    }

    OwnerStates ownerState = _wallets[wallet].ownerStates[owner];

    if (_isGateway(owner)) {
      if (ownerState != OwnerStates.Removed) {
        revert WalletOwnerAlreadyExists();
      }
    } else {
      if (ownerState == OwnerStates.Added) {
        revert WalletOwnerAlreadyExists();
      }

      _wallets[wallet].ownerIndex[owner] = _wallets[wallet].owners.length;
      _wallets[wallet].owners.push(owner);
    }

    _wallets[wallet].ownerStates[owner] = OwnerStates.Added;

    emit WalletOwnerAdded(wallet, owner);
  }

  function removeWalletOwner(address owner) external {
    address wallet = _msgSender();

    if (owner == address(0)) {
      revert WalletOwnerIsTheZeroAddress();
    }

    OwnerStates ownerState = _wallets[wallet].ownerStates[owner];

    if (ownerState == OwnerStates.Unknown) {
      if (_isGateway(owner)) {
        if (_wallets[wallet].owners.length == 0) {
          revert OwnerlessWallet();
        }
      } else {
        revert WalletOwnerDoesntExist();
      }
    } else if (ownerState == OwnerStates.Added) {
      if (!_isGateway(owner)) {
        uint256 index = _wallets[wallet].ownerIndex[owner];

        if (index != (_wallets[wallet].owners.length - 1)) {
          uint256 ownerIndex = _wallets[wallet].ownerIndex[owner];
          uint256 lastOwnerIndex = _wallets[wallet].owners.length - 1;

          if (ownerIndex != lastOwnerIndex) {
            address lastOwner = _wallets[wallet].owners[lastOwnerIndex];

            _wallets[wallet].ownerIndex[lastOwner] = ownerIndex;
            _wallets[wallet].owners[ownerIndex] = lastOwner;
          }
        }

        _wallets[wallet].owners.pop();
      }
    } else {
      revert WalletOwnerDoesntExist();
    }
    _wallets[wallet].ownerStates[owner] = OwnerStates.Removed;

    emit WalletOwnerRemoved(wallet, owner);
  }

  function requestWalletDeployment(
    bytes32 salt,
    address[] calldata owners,
    uint32 gasLimit
  ) external {
    address wallet = _msgSender();

    if (wallet != _computeWalletAddress(salt)) {
      revert InvalidWalletSalt();
    }

    // TODO: fix issue
    //    _walletDeploymentPaymentToken.transferFrom(
    //      wallet,
    //      _owner,
    //      _walletDeploymentCost
    //    );

    uint256 ownersLen = owners.length;
    address[] memory walletOwners = _wallets[wallet].owners;
    uint256 walletOwnersLen = walletOwners.length;

    if (ownersLen == 0 && walletOwnersLen == 0) {
      revert OwnerlessWallet();
    }

    for (uint256 i; i < ownersLen; ) {
      if (owners[i] == address(0)) {
        revert WalletOwnerIsTheZeroAddress();
      }

      unchecked {
        ++i;
      }
    }

    _sendCrossDomainMessage(
      abi.encodeWithSelector(
        GnosisSafeRegistryL1.deployWalletHandler.selector,
        salt,
        ownersLen == 0 ? walletOwners : owners
      ),
      gasLimit
    );
  }
}
