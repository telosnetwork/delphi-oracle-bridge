// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

interface IDelphiOracleBridge {
    function request(uint callId, string calldata pair, uint limit, uint callback_gas, address callback_address) external payable;
    function calculateRequestPrice(uint callback_gas) external view returns(uint);
}

contract DelphiOracleConsumer {
    IDelphiOracleBridge bridge;
    event Received(uint callId, string pair, string owner, uint value, uint median, uint timestamp);

    struct Datapoint {
        string pair;
        string owner;
        uint timestamp;
        uint median;
        uint value;
    }

     mapping (uint => string) public answers;
     struct Request {
        uint id;
        string pair;
     }
     Request[] public requests;
     uint count;

    constructor(address _bridge) {
        bridge = IDelphiOracleBridge(_bridge);
        count = 0;
    }

    function makeRequest(string calldata pair, uint limit, uint callback_gas) external {
        require(msg.value > 0, "Request needs fee and callback gas passed");
        require(limit <= 100, "Maximum limit is 100");

        uint price = bridge.calculateRequestPrice(callback_gas);
        require(price > 0, "Could not calculate price");
        require(address(this).balance >= price, "Contract balance is too low");

        requests.push(Request(count, pair));
        bridge.request{value: price }(count, pair, limit, callback_gas, address(this));
        count++;
    }

    function receiveDatapoints(uint callId, Datapoint[] calldata datapoints) external {
        require(msg.sender == address(bridge), "Only the bridge contract can call this function");
         for(uint i = 0; i < requests.length;i++){
            if(requests[i].id == callId){
                requests[i] = requests[requests.length - 1];
                requests.pop();
                if(datapoints.length == 0){
                    return; // No datapoints (ie: oracles failed to update, pair requested doesn't exist, ...), we stop there
                }
                answers[callId] = datapoints[0].pair;
                for(uint k = 0; k < datapoints.length; k++){
                    emit Received(callId, datapoints[k].pair, datapoints[k].owner, datapoints[k].value, datapoints[k].median, datapoints[k].timestamp); // POC, implement your own logic here instead
                }
                return;
            }
         }
    }
}