# Delphi Oracle Bridge :: EVM

### INSTALL

`npm install`

### BUILD & TEST

Run the tests with:

`npx hardhat test`

### BUILD & DEPLOY

This will deploy the `DelphiOracleBridge` contract as well as a `DelphiOracleConsumer` contract so that you can interact directly with the bridge. Users should write their own implementation of the consumer, using the same `receiveDatapoints(uint, Datapoint[] calldata) external` callback function. The `GasOracleBridge` contract is just included for test purposes and will not be deployed.

Deploy the contracts with:

`npx hardhat deploy --network=testnet`

⚠️ **Save the address output in console to configure the antelope contract next**

### VERIFY

Verify the contract  with:

`npx hardhat sourcify --network=testnet`

### CONFIGURE

Start the console with:

`npx hardhat console --network=testnet`

Use ethers to get an instance of the bridge and configure the EVM address of the anteloppe contract, like so

`await bridge.setOracleEVMContract('0xf8Da1....')`

_If your anteloppe contract doesn't have an EVM address yet use the `eosio.evm` contract `create(account, data)` action to create one._

