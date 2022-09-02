# Delphi Oracle Bridge :: Antelope

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