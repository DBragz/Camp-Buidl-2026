pragma solidity ^0.8.30;

contract MyNFT {

    struct Unicorn {
        uint horn_length;
        string name;
        bool has_magnestic;
    }

    mapping(uint => address) owners;
    mapping(uint => Unicorn) unicorns;

    uint current_id = 0;

    constructor() {

    }

    function transfer(address _to, uint _id) external {
        require(owners[_id] == msg.sender, "You are not the owner.");

        // 0 = 0x0000000000000000000000000000000000000000
        require(_to != address(0));
        owners[_id] = _to;
    }

    function mintNFT(uint _hornL, string calldata _name, bool _magnestic) external {
        owners[current_id] = msg.sender;
        unicorns[current_id] = Unicorn(_hornL, _name, _magnestic);

        current_id++;
    }

    function uri(uint _id) public view returns (string memory) {
        return unicorns[_id].name;
    }

    function update(uint _id, uint _horn_length) external {
        require(owners[_id] == msg.sender, "Only the woner can update the horn.");
        unicorns[_id].horn_length = _horn_length;
    }

}
