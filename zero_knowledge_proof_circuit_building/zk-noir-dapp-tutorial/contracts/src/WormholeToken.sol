// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ERC20} from "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import {HonkVerifier} from "./verifiers/wormhole_verifier.sol";
import {LeanIMT, LeanIMTData} from "zk-kit.solidity/packages/lean-imt/contracts/LeanIMT.sol";
import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";

contract WormholeToken is ERC20 {
    using LeanIMT for LeanIMTData;

    HonkVerifier public immutable verifier;

    LeanIMTData public tree;

    mapping(bytes32 root => bool) internal _validRoots;

    mapping(bytes32 nullifier => bool) public spentNullifiers;

    constructor(address initialHolder) ERC20("WormholeToken", "WHT") {
        verifier = new HonkVerifier();
        _mint(initialHolder, 1_000_000_000e18);
    }

    function _update(address from, address to, uint256 value) internal virtual override {
        super._update(from, to, value);
        if (to != address(0)) {
            uint256 leaf = PoseidonT3.hash([uint256(uint160(to)), value]);
            uint256 newRoot = tree.insert(leaf);
            _validRoots[bytes32(newRoot)] = true;
        }
    }

    function getTree() public view returns (uint256 root, uint256 size, uint256 depth) {
        return (tree.root(), tree.size, tree.depth);
    }

    function verifyAndMint(address to, uint256 amount, bytes32 root, bytes32 nullifier, bytes calldata proof) public {
        require(_validRoots[root], "Invalid root");
        require(!spentNullifiers[nullifier], "Nullifier already spent");
        require(_validRoots[root], "Invalid root");

        // Format public inputs
        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = bytes32(uint256(uint160(to)));
        publicInputs[1] = bytes32(amount);
        publicInputs[2] = root;
        publicInputs[3] = nullifier;

        // Verify proof
        require(verifier.verify(proof, publicInputs), "Invalid proof");

        // Update state
        spentNullifiers[nullifier] = true;
        
        // Mint tokens to recipient
        _mint(to, amount);
    }
}
