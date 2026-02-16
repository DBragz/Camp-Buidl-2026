// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test} from "forge-std/Test.sol";
import {Voting} from "../src/Voting.sol";

contract VotingTest is Test {
    Voting public voting;

    address alice = address(0x1);
    address bob = address(0x2);
    address carol = address(0x3);
    address dave = address(0x4);
    address eve = address(0x5);

    function setUp() public {
        voting = new Voting();
    }

    function test_CreateProposal() public {
        uint256 proposalId = voting.createProposal("Fund project X", 3);
        assertEq(proposalId, 0);
        assertEq(voting.proposalCount(), 1);

        (
            string memory description,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 threshold,
            bool thresholdReached
        ) = voting.getProposal(0);

        assertEq(description, "Fund project X");
        assertEq(votesFor, 0);
        assertEq(votesAgainst, 0);
        assertEq(threshold, 3);
        assertFalse(thresholdReached);
    }

    function test_VoteCastEvent() public {
        voting.createProposal("Proposal", 2);

        vm.prank(alice);
        vm.expectEmit(true, true, true, true);
        emit Voting.VoteCast(0, alice, true);
        voting.vote(0, true);

        vm.prank(bob);
        vm.expectEmit(true, true, true, true);
        emit Voting.VoteCast(0, bob, false);
        voting.vote(0, false);
    }

    function test_ThresholdReachedEvent() public {
        voting.createProposal("Reach threshold", 3);

        vm.prank(alice);
        voting.vote(0, true);

        vm.prank(bob);
        voting.vote(0, true);

        vm.prank(carol);
        vm.expectEmit(true, true, true, true);
        emit Voting.ThresholdReached(0, 3, 3);
        voting.vote(0, true);
    }

    function test_ThresholdReachedOnlyOnce() public {
        voting.createProposal("Threshold once", 2);

        vm.prank(alice);
        voting.vote(0, true);

        vm.prank(bob);
        voting.vote(0, true);
        // Threshold reached here

        vm.prank(carol);
        voting.vote(0, true);
        // No second ThresholdReached - we just check state
        (, uint256 votesFor, , uint256 threshold, bool thresholdReached) = voting.getProposal(0);
        assertEq(votesFor, 3);
        assertEq(threshold, 2);
        assertTrue(thresholdReached);
    }

    function test_VotesCountCorrectly() public {
        voting.createProposal("Count votes", 10);

        vm.prank(alice);
        voting.vote(0, true);
        (, uint256 for1, uint256 against1, , ) = voting.getProposal(0);
        assertEq(for1, 1);
        assertEq(against1, 0);

        vm.prank(bob);
        voting.vote(0, false);
        (, uint256 for2, uint256 against2, , ) = voting.getProposal(0);
        assertEq(for2, 1);
        assertEq(against2, 1);

        vm.prank(carol);
        voting.vote(0, true);
        (, uint256 for3, uint256 against3, , ) = voting.getProposal(0);
        assertEq(for3, 2);
        assertEq(against3, 1);
    }

    function test_RevertWhen_AlreadyVoted() public {
        voting.createProposal("No double vote", 1);
        vm.prank(alice);
        voting.vote(0, true);

        vm.prank(alice);
        vm.expectRevert("Voting: already voted");
        voting.vote(0, false);
    }

    function test_RevertWhen_InvalidProposal() public {
        vm.expectRevert("Voting: invalid proposal");
        voting.vote(0, true);
    }

    function test_RevertWhen_InvalidProposalGetProposal() public {
        vm.expectRevert("Voting: invalid proposal");
        voting.getProposal(0);
    }

    function test_MultipleProposals() public {
        uint256 id0 = voting.createProposal("First", 1);
        uint256 id1 = voting.createProposal("Second", 2);
        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(voting.proposalCount(), 2);

        vm.prank(alice);
        voting.vote(0, true);
        (, , , , bool reached0) = voting.getProposal(0);
        assertTrue(reached0);

        vm.prank(bob);
        voting.vote(1, true);
        vm.prank(carol);
        voting.vote(1, true);
        (, , , , bool reached1) = voting.getProposal(1);
        assertTrue(reached1);
    }
}
