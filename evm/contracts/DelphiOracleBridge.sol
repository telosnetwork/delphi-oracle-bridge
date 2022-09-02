pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IGasOracleBridge {
    getPrice() external view returns(uint);
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
}

contract DelphiOracleBridge is Ownable {
    event  Requested(address indexed requestor, uint callId, string pair);
    event  Replied(address indexed requestor, uint callId, string pair);

     struct Request {
        uint id;
        address caller_address;
        uint caller_id;
        uint requested_at;
        uint limit;
        string pair;
        uint callback_gas;
     }

     mapping (address => uint) public request_count;
     Request[] public requests; // Not using a mapping to be able to read from accountstate in native (else we need to know the mapping key we want to lookup)

     IGasOracle public gasOracle;

     uint public fee;
     uint public maxRequests;

     address public oracleEvmContract;

      constructor(uint _fee, uint _maxRequests, address _oracleEvmContract, address _gasOracle) {
        fee = _fee;
        maxRequests = _maxRequests;
        oracleEvmContract = _oracleEvmContract;
        gasOracle = IGasOracleBridge(_gasOracle)
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

     function getCost(uint callback_gas) external view returns(uint) {
        (bool success, bytes memory data) = gasOracle.getPrice();
        require(success, "Could not get gas price from gas oracle");
        uint gasPrice = abi.decode(data, (uint));
        return (fee + ((callback_gas * gasPrice  / 10**9)));
     }

     // REQUEST HANDLING ================================================================ >
     function request(uint callId, string memory pair, uint limit, uint callback_gas) external payable returns (bool) {
        require(msg.value == getCost(callback_gas), "Send enough TLOS to cover the callback_gas and fee");
        require(request_count[msg.sender] < maxRequests, "Maximum requests reached, wait for replies or delete one");
        require(bytes(pair).length > 0, "No pair was passed");
        require(bytes(pair).length < 33, "Pair string must be 32b or less");
        require(limit < 10, "Maximum limit is 10");

        // CHECK EXISTS
        require(!this.requestExists(msg.sender, callId), "Call ID already exists");

        // SEND FEE & CALLBACK GAS TO ORACLE EVM ADDRESS SO IT CAN SEND THE RESPONSE BACK
        payable(oracleEvmContract).transfer(msg.value);

        request_count[msg.sender]++;

        // BUILD REQUEST
        uint id = 0;
        if(requests.length > 0){
            id = requests[requests.length - 1].id + 1;
        }
        requests.push(Request (id, msg.sender, callId, block.timestamp, limit, pair, callback_gas));

        emit Requested(msg.sender, callId, pair);

        return true;
     }

     function deleteRequest(uint id) external returns (bool) {
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
        require(datapoints.length > 0, "Response requires at least one datapoint");
        for(uint i = 0; i < requests.length; i++){
            if(requests[i].id == callId){
                uint caller_id = requests[i].caller_id;
                address caller = requests[i].caller_address;
                // Delete no matter what what happens to callback
                string memory pair = requests[i].pair;
                uint gas = requests[i].callback_gas;
                requests[i] = requests[requests.length - 1];
                requests.pop();
                request_count[caller]--;
                if(gas > 0){
                    IDelphiOracleConsumer(caller).receiveDatapoints{gas: gas}(callId, datapoints);
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