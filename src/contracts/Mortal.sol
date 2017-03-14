pragma solidity ^0.4.9;

import "./Owned.sol";

contract Mortal is Owned {

    /**this function does not need a modifier as it does nothing if the sender is not the owner*/
    function kill() {
        if (msg.sender == owner) selfdestruct(owner);
    }
}

