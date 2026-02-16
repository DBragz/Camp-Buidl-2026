pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MyFram { 
  // Reward paramaters.
  addresss public lockedToken;
  addresss public rewardToken;

  //  Track how much is deposited.
  mapping(address => uint) public timeOfDeposit;
  mapping(address => uint) public amountDeposit;

  // Create instane of ERC20 tokens.
  address public depositAddress;
  address public rewardAddress;

  constructor(address _lockedToken, address _rewardToken) {
    lockedToken = _lockedToken;
    rewardToken = _rewardToken;
  }

  function deposit(uint amount) external {
    IERC20(depositAddress).transferFrom(msg.sender, address(this), amount);
    timeOfDeposit[msg.sender] = block.timestamp;
    amountDeposit[msg.sender] += amount;
  }

  function claim() external {
    uint rewardPerSecond = 55;
    uint rewardAmount = rewardPerSecond * amountDeposit[msg.sender];
    uint lengthOfDeposit = block.timestamp - timeOfDeposit[msg.sender];

    rewardAmount = rewardAmount * lengthOfDeposit;
    IERC20(rewardAddress).transferFrom(address(this), msg.sender, rewardToken);

    timeOfDeposit[msg.sender] = block.timestamp;

  }

  function withdraw() external {

  }
}
