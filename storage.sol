pragma solidity >=0.4.22 <0.7.0;

contract Storage {
    uint256 number;


    function store(uint256 num) public {
        number = num;
    }

    function retrieve() public view returns (uint256) {
        return number;
    }


}