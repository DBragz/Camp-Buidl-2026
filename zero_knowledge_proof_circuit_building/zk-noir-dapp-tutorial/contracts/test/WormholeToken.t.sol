// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {WormholeToken} from "../src/WormholeToken.sol";

contract WormholeTokenTest is Test {
    WormholeToken public wormholeToken;

    address public alice = makeAddr("alice");

    function setUp() public {
        wormholeToken = new WormholeToken(alice);
    }

    function test_InitialSupply() public {
        assertEq(wormholeToken.balanceOf(alice), 1_000_000_000e18);
        assertEq(wormholeToken.totalSupply(), 1_000_000_000e18);
    }
}
