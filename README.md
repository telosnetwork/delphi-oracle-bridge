# Delphi Oracle EVM Bridge

This repository contains the Telos Delphi Oracle EVM <> Antelope Bridge.

The bridge requires the deployment of 3 components to work: the EVM & Antelope components which are part of this repository and Listener component that is part of our [Telos Oracle Scripts](https://github.com/telosnetwork/telos-oracle-scripts) repository. Follow the instructions below to deploy it.

## EVM

### DelphiOracleBridge

The bridge's EVM contract. Receives requests and sends responses back to a callback function. Currently deployed at

**TESTNET :** TBD

**MAINNET :** TBD

### DelphiOracleConsumer

Example implementation of a consumer with a DelphiOracleBridge `request` call and a callback function

### GasOracleBridge

Query current gas price from a smart contract. This contract is only included for test purposes and will not be deployed.

_To learn how to deploy it, refer to the documentation inside the `evm` folder_

## Antelope

### delphi.bridge.cpp

The bridge's Antelope contract, it gets notified of new request on the EVM contract by listeners, then it checks out the request and imports it, finally it queries the relevant data and sends it back to the EVM contract using `eosio.evm`

**TESTNET :** delphibridge

**MAINNET :** delphibridge

_To learn how to deploy it, refer to the documentation inside the `antelope` folder_

## Listeners

The listener for this bridge is located inside our [Telos Oracle Scripts](https://github.com/telosnetwork/telos-oracle-scripts) repository

Refer to the configuration sample's **listeners > delphi > bridge** section for an example.

## Make a request !

Deploy a contract that calls the `DelphiOracleBridge` contract's `request(uint callId, string memory pair, uint limit, uint callback_gas, address callback_address) external payable` function, passing a value to cover fee and callback gas cost (see below). On the same contract, or in a new one, implement a `receiveDatapoints(uint callId, Datapoint[] calldata datapoints) external` callback function in order to receive the oracle's answer as well as the following Struct:

```
    struct Datapoint {
        string pair;
        string owner;
        uint timestamp;
        uint median;
        uint value;
    }
```

You can refer to the [`DelphiOracleConsumer`](https://github.com/telosnetwork/delphi-oracle-bridge/blob/master/evm/contracts/DelphiOracleConsumer.sol) EVM contract for a basic example. It implements the call to `request` and the `receiveDatapoints` callback in the same contract.

### What is callback gas ? How do I know what value to pass ?

The `callback_gas` variable contains the gas units you estimate will be needed to call your `receiveDatapoints(uint callId, Datapoint[] calldata datapoints) external` implementation of the callback function in your own smart contract (ie: 50000). This is the maximum amount of gas that will be spent by the bridge when calling your contract, if your callback implementation asks for more gas, the transaction will fail and the request will be deleted from the bridge's storage.

You can query the TLOS value to pass in your `request()` function call by calling the `getCost(uint callback_gas)` function.

You can also calculate that cost by taking the gas price from the [`GasOracleBridge`](https://github.com/telosnetwork/gas-oracle-bridge) with `getPrice()`, multiply that price with your estimate gas units (ie: 50000) and add the fee from the `DelphiOracleBridge` that you can query with `fee()`:

`Cost = Gas Units * Gas Price + Bridge Fee`
