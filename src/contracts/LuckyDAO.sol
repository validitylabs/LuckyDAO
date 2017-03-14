pragma solidity ^0.4.9;


import "./Mortal.sol";


contract LuckyDAO is Mortal {
    struct Guess {
        uint guess;
        address submitter;
    }

    bytes32 secretHash;
    uint secretNum;
    uint maxGuesses;

/*a mapping of ETH balances for the aprticipants*/
    mapping (uint => Guess) guesses;

    function LuckyDAO(bytes32 _secretHash) {
        secretHash = _secretHash;
    }

    function revealSecret(uint _secretNum) ownerOnly returns (bool){
        if(secretHash == sha3(_secretNum,msg.sender)){
            secretNum = _secretNum;
            return owner.send(this.balance);
        }
        return false;
    }

    function getWinner() constant returns(address _winner, uint _bestGuess) {
        if(secretNum > 1) {
            bool noGuess = true;
            uint bestGuess = 0;
            for(uint i = 0; i < maxGuesses; i++) {
                int compare = int(secretNum - guesses[i].guess);
                if(compare < 0) compare = compare * -1; //I did not find an abs function
                if(noGuess || int(guesses[bestGuess].guess) > compare){
                    bestGuess = i;
                    noGuess = false;
                } 
            }
            return (guesses[bestGuess].submitter, guesses[bestGuess].guess);
        }
    }

/*Fallback function for the contract. send ETH to the contract to register*/
    function() payable {
        guesses[maxGuesses].guess = msg.value;
        guesses[maxGuesses].submitter = msg.sender;
        maxGuesses ++;
    }

}