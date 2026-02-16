// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

/**
 * @title Voting
 * @notice Emits an event when a configurable vote threshold is reached.
 */
contract Voting {
    /// @notice Emitted when the required number of votes is reached for a proposal.
    event ThresholdReached(uint256 indexed proposalId, uint256 votes, uint256 threshold);

    /// @notice Emitted when a vote is cast.
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support);

    struct Proposal {
        string description;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 threshold;
        bool thresholdReached;
    }

    Proposal[] public proposals;

    /// @notice Mapping: proposalId => voter => has voted
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    /// @notice Create a new proposal with a vote threshold.
    /// @param description Short description of the proposal.
    /// @param threshold Number of votes (for) required to trigger ThresholdReached.
    function createProposal(string calldata description, uint256 threshold) external returns (uint256 proposalId) {
        proposalId = proposals.length;
        proposals.push(Proposal({
            description: description,
            votesFor: 0,
            votesAgainst: 0,
            threshold: threshold,
            thresholdReached: false
        }));
        return proposalId;
    }

    /// @notice Cast a vote. Emits ThresholdReached when votesFor meets the threshold (only once per proposal).
    /// @param proposalId Id of the proposal.
    /// @param support True = for, false = against.
    function vote(uint256 proposalId, bool support) external {
        require(proposalId < proposals.length, "Voting: invalid proposal");
        require(!hasVoted[proposalId][msg.sender], "Voting: already voted");

        hasVoted[proposalId][msg.sender] = true;
        Proposal storage p = proposals[proposalId];

        if (support) {
            p.votesFor++;
            emit VoteCast(proposalId, msg.sender, true);

            if (!p.thresholdReached && p.votesFor >= p.threshold) {
                p.thresholdReached = true;
                emit ThresholdReached(proposalId, p.votesFor, p.threshold);
            }
        } else {
            p.votesAgainst++;
            emit VoteCast(proposalId, msg.sender, false);
        }
    }

    /// @notice Get proposal details.
    function getProposal(uint256 proposalId) external view returns (
        string memory description,
        uint256 votesFor,
        uint256 votesAgainst,
        uint256 threshold,
        bool thresholdReached
    ) {
        require(proposalId < proposals.length, "Voting: invalid proposal");
        Proposal storage p = proposals[proposalId];
        return (p.description, p.votesFor, p.votesAgainst, p.threshold, p.thresholdReached);
    }

    /// @notice Total number of proposals.
    function proposalCount() external view returns (uint256) {
        return proposals.length;
    }
}
