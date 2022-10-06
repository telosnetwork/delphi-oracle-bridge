# Delphi Oracle EVM Bridge

This repository contains the Telos Delphi Oracle EVM <> Antelope Bridge.

The bridge requires the deployment of 3 components to work: the EVM & Antelope components which are part of this repository and Listener component that is part of our [Telos Oracle Scripts](https://github.com/telosnetwork/telos-oracle-scripts) repository. Follow the instructions below to deploy it.

## EVM

### DelphiOracleBridge.sol

The bridge's EVM contract. Receives requests and sends responses back to a callback function. Currently deployed at

**TESTNET :** TBD

**MAINNET :** TBD

### DelphiOracleConsumer.sol

Example implementation of a consumer with a DelphiOracleBridge `request` call and a callback function

### GasOracleBridge.sol

Query current gas price from a smart contract. This contract is only included for test purposes and will not be deployed.

_To learn how to deploy those contracts, refer to the documentation inside the [`evm`](https://github.com/telosnetwork/delphi-oracle-bridge/tree/master/evm) folder_

## ANTELOPE

### delphi.bridge.cpp

The bridge's Antelope contract, it gets notified of new request on the EVM contract by listeners, then it checks out the request and imports it, finally it queries the relevant data and sends it back to the EVM contract using `eosio.evm`

**TESTNET :** delphibridge

**MAINNET :** TBD

_To learn how to deploy it, refer to the documentation inside the [`antelope`](https://github.com/telosnetwork/delphi-oracle-bridge/tree/master/antelope) folder_

## LISTENERS

The listener for this bridge is located inside our [Telos Oracle Scripts](https://github.com/telosnetwork/telos-oracle-scripts) repository

Refer to the configuration sample's **listeners > delphi > bridge** section for an example.

## USING THE BRIDGE

Follow the documentation available in Telos docs [here]() to learn how to query pair prices using our Delphi Oracle Bridge.
