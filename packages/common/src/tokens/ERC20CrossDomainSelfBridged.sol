// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../optimism/CrossDomainSelfBridged.sol";
import "./ERC20.sol";

abstract contract ERC20CrossDomainSelfBridged is CrossDomainSelfBridged, ERC20 {
  // events

  event CrossDomainTransferRequested(address from, address to, uint256 amount);

  event CrossDomainTransferCompleted(address from, address to, uint256 amount);

  // external functions

  function crossDomainTransfer(
    address to,
    uint256 amount,
    uint32 gasLimit
  ) external {
    address sender = _msgSender();

    _burn(sender, amount);

    _sendCrossDomainMessage(
      abi.encodeWithSelector(
        ERC20CrossDomainSelfBridged.crossDomainTransferHandler.selector,
        sender,
        to,
        amount
      ),
      gasLimit
    );

    emit CrossDomainTransferRequested(sender, to, amount);
  }

  function crossDomainTransferHandler(
    address from,
    address to,
    uint256 amount
  ) external onlyCrossDomainSelfCall {
    _mint(to, amount);

    emit CrossDomainTransferCompleted(from, to, amount);
  }
}
