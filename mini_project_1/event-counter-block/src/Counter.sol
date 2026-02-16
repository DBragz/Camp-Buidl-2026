// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

contract Counter {
    string public name;
    string public description;
    uint256 public number;
    uint256 public threshold;
    bool private _thresholdReached;

    event ThresholdReached(uint256 number, uint256 threshold);

    constructor(string memory _name, string memory _description) {
        name = _name;
        description = _description;
    }

    function setThreshold(uint256 _threshold) public {
        threshold = _threshold;
    }

    function setNumber(uint256 newNumber) public {
        number = newNumber;
        _emitThresholdIfReached();
    }

    function increment() public {
        number++;
        _emitThresholdIfReached();
    }

    function _emitThresholdIfReached() private {
        if (!_thresholdReached && threshold > 0 && number >= threshold) {
            _thresholdReached = true;
            emit ThresholdReached(number, threshold);
        }
    }
}
