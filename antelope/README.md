# Delphi Oracle Bridge :: Antelope

### REQUIREMENTS

This part of the repository requires the [`cleos`](https://developers.eos.io/manuals/eos/v2.2/cleos/index) command line tool

### INSTALL

`npm install`

### CONFIGURE

Edit the following values in the `env` file:

### BUILD

Run the following command:

`bash build.sh`

Files will be saved to the `build` directory

### DEPLOY

You can deploy the contract using cleos with the following command:

`cleos --url http://testnet.telos.net set contract YOUR_CONTRACT_ACCOUNT ./build ./delphi.bridge.cpp ./delphi.bridge.hpp`

### CONFIGURE

After deploying the EVM contract, configure its address like so:

`cleos --url http://testnet.telos.net push action YOUR_CONTRACT_ACCOUNT setevmctc '{"new_contract": "f7d3A11...."}' -p YOUR_CONTRACT_ACCOUNT`

Note that the address is an EVM address without the 0x prefix.
