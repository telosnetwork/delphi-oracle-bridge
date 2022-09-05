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
