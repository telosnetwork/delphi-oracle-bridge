#! /bin/bash
echo ">>> Building contract..."
eosio-cpp -I="./include/"  -I="./external/"  -o="./build/delphi.bridge.wasm" -contract="delphibridge" -abigen ./src/delphi.bridge.cpp