pragma solidity ^0.8.30;

// Class is capitalized.
contract MyToken {
  uint8 mynumber = 5;

  // Who should get our tokens to begin with?
  address owner;

  mapping (address user => uint256 balance) public balances;

  // Called when contract is deployed to Ethereum.
  constructor() {
    // msg.sender is special. Here, msg.sender is the account that deployed the contract.
    owner = msg.sender;

    // What else should we initialize?
    // Mint the owner 1000 myTokens and put it in the mapping.
    balance[owner] = 1000;
  }

  function transfer (uint amount, address recipient) public {
    // Safety first.
    require(amount <= balances[msg.sender]);
    require(balances[msg.sender] - amount <= balances[msg.sender]);
    require(balances[recipient] + amount >= balances[recipient]);

    // Always subtract first.
    balances[msg.sender] -= amount;
    balances[recipient] += amount;
  }
}

