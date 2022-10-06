# Delphi Oracle Bridge :: Antelope

### REQUIREMENTS

This part of the repository requires the [`cleos`](https://developers.eos.io/manuals/eos/v2.2/cleos/index) command line tool as well as NodeJS 14+ with NPM.

It also requires the EVM `DelphiOracleBridge.sol` contract to be deployed in order to configure it.

### INSTALL

`npm install`

### BUILD

Run the following command:

`bash build.sh`

Files will be saved to the `build` directory

### DEPLOY

You can deploy the contract using cleos with the following command:

`bash deploy.sh`

### CONFIGURE

After deploying the EVM contract, configure its address like so:

`cleos --url http://testnet.telos.net push action YOUR_CONTRACT_ACCOUNT setevmctc '{"new_contract": "f7d3A11...."}' -p YOUR_CONTRACT_ACCOUNT`

_Note that the address is the `DelphiOracleBridge.sol` EVM address without the 0x prefix._
