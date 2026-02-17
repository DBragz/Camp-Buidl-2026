// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script} from "forge-std/Script.sol";
import {WormholeToken} from "../src/WormholeToken.sol";
import {console} from "forge-std/console.sol";

contract WormholeTokenScript is Script {
    WormholeToken public wormholeToken;

    function run() public {
        vm.startBroadcast();

        wormholeToken = new WormholeToken(msg.sender);

        vm.stopBroadcast();
        
        console.log("WormholeToken deployed to:", address(wormholeToken));
    }
}
