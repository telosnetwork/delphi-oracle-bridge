# Delphi Oracle EVM Bridge

This repository contains the Telos Delphi Oracle EVM <> Antelope Bridge.
It is divided in 3 sections: EVM, Antelope and listener scripts ran by oracles.

## EVM

### DelphiOracleBridge

Receives requests and sends responses back to a callback function

### DelphiOracleConsumer

Example implementation of a consumer with a callback function

### GasOracleBridge

Query current gas price from a smart contract. This contract is only included for test purposes and will not be deployed.

For more, refer to the documentation inside the `evm` folder

## Antelope

### delphi.bridge.cpp

For more, refer to the documentation inside the `antelope` folder

## Listeners

### RequestListener

Listens to new requests and calls the `reqnotify()` action of `delphi.bridge.cpp`

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

You can refer to the [`DelphiOracleConsumer`](https://github.com/telosnetwork/delphi-oracle-bridge/blob/master/evm/contracts/DelphiOracleConsumer.sol) EVM contract for a basic example.

### What is callback gas ? How do I know what value to pass ?

The `callback_gas` variable contains the gas units you estimate will be needed to call your `receiveRandom()` callback function in your own smart contract (ie: 50000). This is the maximum amount of gas that will be spent by the bridge when calling your contract, if your callback implementation asks for more gas, the transaction will fail and the request will be deleted from storage.

You can query the TLOS value to pass in your `request()` function call by calling the `getCost(uint callback_gas)` function.

You can also calculate that cost by taking the gas price from the `GasOracleBridge` with `getPrice()`, multiply that price with your estimate gas units (ie: 50000) and add the fee from the `DelphiOracleBridge` that you can query with `fee()`:

`Cost = Gas Units * Gas Price + Bridge Fee`
