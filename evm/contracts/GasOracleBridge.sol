pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract GasOracleBridge is Ownable {
     event Updated(uint gas_price);

     address public oracleEvmContract;
     uint public gasPrice;

     constructor(address _oracleEvmContract, uint _initialGasPrice) {
        oracleEvmContract = _oracleEvmContract;
        gasPrice = _initialGasPrice;
     }

     function setOracleEvmContract(address _oracleEvmContract) external onlyOwner {
        oracleEvmContract = _oracleEvmContract;
     }

     function getPrice() external view returns(uint) {
        return gasPrice;
     }

     function setPrice(uint _gasPrice) external {
        require(msg.sender == oracleEvmContract, "Only the native oracle bridge EVM address can call this function");
        gasPrice = _gasPrice;
        emit Updated(_gasPrice);
     }

}