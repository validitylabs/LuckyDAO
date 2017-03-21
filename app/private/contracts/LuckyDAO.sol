pragma solidity ^0.4.9;


import "./Mortal.sol";

contract LuckyDAO is Mortal {
    struct Guess {
        uint floor; // start of the guess window
        uint ceil; // end of the guess window = floor + paid wei
    }

    mapping(address => Guess[]) guesses;

    uint public secret;
    uint public totalPaid;
    uint public endTimeStamp;

/*a mapping of ETH balances for the aprticipants*/
    mapping (uint => address) public participants;
    uint public nbParticipants;

    /*the constructor expects an endDate in seconds NOT miliseconds from 1970*/
    function LuckyDAO(uint _endTimeStamp) {
        endTimeStamp = _endTimeStamp;
    }

    function computeSecret(uint _secretNum, address _address) constant returns (bytes32) {
        return sha3(_secretNum, _address);
    }

    function isWinner(address _participant) constant returns(bool) {
        for(uint8 i = 0; i < guesses[_participant].length; i++) {
            if(secret >= guesses[_participant][i].floor && secret >= guesses[_participant][i].ceil) {
                return true;
            }
        }
        return false;
    }

/*Fallback function for the contract. send ETH to the contract to register*/
    function() payable {
        if(secret == 0 && msg.value > 0) {
            if(guesses[msg.sender].length == 0) {
                participants[nbParticipants++] = msg.sender;
            }
            Guess memory guess;
            guess.floor = totalPaid;
            guess.ceil = totalPaid + msg.value;
            guesses[msg.sender].push(guess);
            totalPaid += (msg.value + 1);
        }

        /*the last participant closes the competition even if the value is 0*/
        if(block.timestamp > endTimeStamp && secret == 0) {
            secret = uint(sha3(block.timestamp, block.blockhash(block.number)
                , block.blockhash(block.number - 1)
                , block.blockhash(block.number - 2)
                , block.blockhash(block.number - 3)
                , block.blockhash(block.number - 4))) % totalPaid;
        }
    }

}