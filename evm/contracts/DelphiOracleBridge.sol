pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IGasOracleBridge {
    function getPrice() external view returns(uint);
}

interface IDelphiOracleConsumer {
    struct Datapoint {
        string pair;
        string owner;
        uint timestamp;
        uint median;
        uint value;
    }
    function receiveDatapoints(uint, Datapoint[] calldata) external;
    function onDelphiRequestFail(uint) payable external;
}

contract DelphiOracleBridge is Ownable {
    event  Requested(address indexed requestor, uint callId, string pair);
    event  Replied(address indexed requestor, uint callId, string pair);
    event  GasRefunded(address indexed to, uint callId, uint value);

     struct Request {
        uint id;
        address caller_address;
        uint caller_id;
        uint requested_at;
        uint limit;
        string pair;
        uint callback_gas;
        address callback_address;
     }

     mapping (address => uint) public request_count;
     Request[] public requests; // Not using a mapping to be able to read from accountstate in native (else we need to know the mapping key we want to lookup)
     uint count;

     IGasOracleBridge public gasOracle;

     uint public fee;
     uint public maxRequests;

     address public oracleEvmContract;

      constructor(uint _fee, uint _maxRequests, address _oracleEvmContract, IGasOracleBridge _gasOracle) {
        fee = _fee;
        maxRequests = _maxRequests;
        oracleEvmContract = _oracleEvmContract;
        gasOracle = _gasOracle;
      }

     // SETTERS  ================================================================ >
     function setFee(uint _fee) external onlyOwner returns(bool) {
        fee = _fee;
        return true;
     }

     function setMaxRequests(uint _maxRequests) external onlyOwner returns(bool) {
        maxRequests = _maxRequests;
        return true;
     }

     function setOracleEVMContract(address _oracleEvmContract) external onlyOwner returns(bool) {
        oracleEvmContract = _oracleEvmContract;
        return true;
     }


     function _getCost(uint callback_gas) internal view returns(uint) {
        uint gasPrice =  gasOracle.getPrice();
        return (fee + (callback_gas * gasPrice));
     }

     function getCost(uint callback_gas) external view returns(uint) {
        return _getCost(callback_gas);
     }

     // REQUEST HANDLING ================================================================ >
     function request(uint callId, string memory pair, uint limit, uint callback_gas, address callback_address) external payable returns (bool) {
        require(msg.value == _getCost(callback_gas), "Send enough TLOS to cover the callback_gas and fee, use getCost(uint callback_gas) to get back the exact value to pass in this call.");
        require(request_count[msg.sender] < maxRequests, "Maximum requests reached, wait for replies or delete one");
        require(bytes(pair).length > 0, "No pair was passed");
        require(bytes(pair).length < 33, "Pair string must be 32b or less");
        require(limit < 11, "Maximum limit is 10");

        // CHECK EXISTS
        require(!this.requestExists(msg.sender, callId), "Call ID already exists");

        // SEND FEE & CALLBACK GAS TO ORACLE EVM ADDRESS SO IT CAN SEND THE RESPONSE BACK
        payable(oracleEvmContract).transfer(msg.value);

        request_count[msg.sender]++;

        // BUILD REQUEST
        requests.push(Request (count, msg.sender, callId, block.timestamp, limit, pair, callback_gas, callback_address));

        // INCREMENT COUNT FOR ID
        count++;

        emit Requested(msg.sender, callId, pair);

        return true;
     }

     // Delete request from storage by ID
     function deleteRequest(uint id) payable external returns (bool) {
        for(uint i = 0; i < requests.length; i++){
            if(requests[i].id == id){
                require(msg.sender == requests[i].caller_address || msg.sender == owner(), "Only the requestor or owner can delete a request");
                address caller = requests[i].caller_address;
                requests[i] = requests[requests.length - 1];
                requests.pop();
                request_count[caller]--;
                return true;
            }
        }
        revert("Request not found");
     }

     // REPLY HANDLING ================================================================ >
     function reply(uint callId, IDelphiOracleConsumer.Datapoint[] calldata datapoints) external {
        require(msg.sender == oracleEvmContract, "Only the native oracle bridge EVM address can call this function");
        for(uint i = 0; i < requests.length; i++){
            if(requests[i].id == callId){
                uint caller_id = requests[i].caller_id;
                address caller = requests[i].caller_address;
                address callback_address = requests[i].callback_address;
                // Delete no matter what happens inside the callback
                string memory pair = requests[i].pair;
                uint gas = requests[i].callback_gas;
                requests[i] = requests[requests.length - 1];
                requests.pop();
                request_count[caller]--;
                if(gas > 0){
                    IDelphiOracleConsumer(callback_address).receiveDatapoints{gas: gas}(caller_id, datapoints);
                }
                emit Replied(caller, caller_id, pair);
                return;
            }
        }
        revert("Request not found");
     }

     // UTIL ================================================================ >
     function requestExists(address requestor, uint id) external view returns (bool) {
        for(uint i = 0; i < requests.length; i++){
            if(requests[i].caller_id == id && requests[i].caller_address == requestor ){
                return true;
            }
        }
        return false;
     }
}