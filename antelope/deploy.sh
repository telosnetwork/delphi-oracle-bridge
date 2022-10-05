#! /bin/bash
echo ">>> Deploying contract..."
if [ "$1" == "mainnet" ]
then
  url="https://mainnet.telos.caleos.io"
else
  url="https://testnet.telos.caleos.io"
fi
cleos --url "$url" set contract delphibridge "$PWD/build" delphi.bridge.wasm delphi.bridge.abi
