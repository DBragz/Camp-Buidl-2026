// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Counter} from "../src/Counter.sol";

contract CounterTest is Test {
    Counter public counter;

    function setUp() public {
        counter = new Counter("Test Counter", "For testing");
        counter.setNumber(0);
    }

    function test_NameAndDescription() public {
        assertEq(counter.name(), "Test Counter");
        assertEq(counter.description(), "For testing");
    }

    function test_Increment() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function testFuzz_SetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }

    function test_ThresholdReachedEvent() public {
        counter.setThreshold(3);
        counter.increment();
        counter.increment();
        vm.expectEmit(true, true, true, true);
        emit Counter.ThresholdReached(3, 3);
        counter.increment();
    }

    function test_ThresholdReachedOnlyOnce() public {
        counter.setThreshold(2);
        counter.increment();
        vm.expectEmit(true, true, true, true);
        emit Counter.ThresholdReached(2, 2);
        counter.increment();
        counter.increment();
        // Verify we can still increment after threshold; no second event
        assertEq(counter.number(), 3);
    }
}
