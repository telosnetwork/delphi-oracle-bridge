#! /bin/bash
echo ">>> Building contract..."
if [ ! -d "$PWD/build" ]
then
  mkdir build
fi
eosio-cpp -I="./include/"  -I="./external/"  -o="./build/delphi.bridge.wasm" -contract="delphibridge" -abigen ./src/delphi.bridge.cpp