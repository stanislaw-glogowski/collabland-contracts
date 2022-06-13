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
    mapping(address => uint256) ownerIndexes;
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
  error InvalidWalletDeploymentCostLimit();
  error WalletDeploymentPaymentTokenIsTheZeroAddress();
  error NotEnoughWalletOwners();

  // events

  event Initialized(
    address crossDomainMessenger,
    address gateway,
    address walletMasterCopy,
    address walletDeploymentPaymentToken,
    uint256 walletDeploymentCost
  );

  event WalletOwnerAdded(address wallet, address owner);

  event WalletOwnerRemoved(address wallet, address owner);

  event WalletDeploymentCostUpdated(uint256 walletDeploymentCost);

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
    address walletMasterCopy,
    address walletDeploymentPaymentToken,
    uint256 walletDeploymentCost
  ) external initializer {
    if (walletDeploymentPaymentToken == address(0)) {
      revert WalletDeploymentPaymentTokenIsTheZeroAddress();
    }

    _setCrossDomainMessenger(crossDomainMessenger);

    _setGateway(gateway);

    _setWalletMasterCopy(walletMasterCopy);

    _walletDeploymentPaymentToken = IERC20(walletDeploymentPaymentToken);
    _walletDeploymentCost = walletDeploymentCost;

    emit Initialized(
      crossDomainMessenger,
      gateway,
      walletMasterCopy,
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

  function setWalletDeploymentCost(uint256 walletDeploymentCost)
    external
    onlyOwner
  {
    _walletDeploymentCost = walletDeploymentCost;

    emit WalletDeploymentCostUpdated(walletDeploymentCost);
  }

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

      _wallets[wallet].ownerIndexes[owner] = _wallets[wallet].owners.length;
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
    uint256 ownersLen = _wallets[wallet].owners.length;

    if (_isGateway(owner)) {
      if (ownerState == OwnerStates.Removed) {
        revert WalletOwnerDoesntExist();
      }

      if (ownersLen == 0) {
        revert OwnerlessWallet();
      }
    } else if (ownerState == OwnerStates.Added) {
      if (ownersLen == 1) {
        revert OwnerlessWallet();
      }

      uint256 index = _wallets[wallet].ownerIndexes[owner];
      uint256 lastIndex = ownersLen - 1;

      if (index != lastIndex) {
        address lastOwner = _wallets[wallet].owners[lastIndex];

        _wallets[wallet].owners[index] = lastOwner;
        _wallets[wallet].ownerIndexes[lastOwner] = index;
      }

      delete _wallets[wallet].ownerIndexes[owner];

      _wallets[wallet].owners.pop();
    } else {
      revert WalletOwnerDoesntExist();
    }

    _wallets[wallet].ownerStates[owner] = OwnerStates.Removed;

    emit WalletOwnerRemoved(wallet, owner);
  }

  function requestWalletDeployment(
    bytes32 salt,
    uint256 costLimit,
    uint32 gasLimit
  ) external {
    address wallet = _msgSender();

    if (wallet != _computeWalletAddress(salt)) {
      revert InvalidWalletSalt();
    }

    if (
      address(_walletDeploymentPaymentToken) != address(0) &&
      _walletDeploymentCost != 0
    ) {
      if (costLimit < _walletDeploymentCost) {
        revert InvalidWalletDeploymentCostLimit();
      }

      _walletDeploymentPaymentToken.transferFrom(
        wallet,
        _owner,
        _walletDeploymentCost
      );
    }

    address[] memory walletOwners = _wallets[wallet].owners;

    if (walletOwners.length == 0) {
      revert NotEnoughWalletOwners();
    }

    _sendCrossDomainMessage(
      abi.encodeWithSelector(
        GnosisSafeRegistryL1.deployWalletHandler.selector,
        salt,
        walletOwners
      ),
      gasLimit
    );

    emit WalletDeploymentRequested(wallet, salt, walletOwners, gasLimit);
  }
}
