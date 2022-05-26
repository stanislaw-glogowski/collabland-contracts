// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../optimism/Bridged.sol";
import "./ERC20.sol";

abstract contract ERC20Bridged is Bridged, ERC20 {
  // external functions

  function crossDomainTransfer(
    address to,
    uint256 amount,
    uint32 gasLimit
  ) external {
    uint256 messageId = _incOutgoingMessageCounter();
    address sender = _msgSender();

    _burn(sender, amount);

    _sendMessage(
      address(this),
      abi.encodeWithSelector(
        ERC20Bridged.crossDomainTransferHandler.selector,
        messageId,
        to,
        amount
      ),
      gasLimit
    );
  }

  function crossDomainTransferMany(
    address[] calldata to,
    uint256[] calldata amount,
    uint32 gasLimit
  ) external {
    uint256 messageId = _incOutgoingMessageCounter();
    address sender = _msgSender();

    uint256 totalAmount;

    {
      uint256 len = to.length;

      for (uint256 i; i < len; ) {
        totalAmount += i;

        unchecked {
          ++i;
        }
      }
    }

    _burn(sender, totalAmount);

    _sendMessage(
      address(this),
      abi.encodeWithSelector(
        ERC20Bridged.crossDomainTransferManyHandler.selector,
        messageId,
        to,
        amount
      ),
      gasLimit
    );
  }

  function crossDomainTransferHandler(
    uint256 messageId,
    address to,
    uint256 amount
  ) external onlyCrossDomainSelfCall {
    _addIncomingMessageId(messageId);

    _mint(to, amount);
  }

  function crossDomainTransferManyHandler(
    uint256 messageId,
    address[] calldata to,
    uint256[] calldata amount
  ) external onlyCrossDomainSelfCall {
    _addIncomingMessageId(messageId);

    uint256 len = to.length;

    for (uint256 i; i < len; ) {
      _mint(to[i], amount[i]);

      unchecked {
        ++i;
      }
    }
  }
}
