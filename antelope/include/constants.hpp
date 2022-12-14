#pragma once

// Adds superpower testing functions (required for running cpp tests/clearing data in contract)
#define TESTING true

// Crypto
#define MBEDTLS_ASN1_OCTET_STRING 0x04

// Bridge
#define FUNCTION_ANSWER_SIGNATURE "abbbc0e0" // our EVM receive function signature
#define STORAGE_INDEX 2 // our EVM storage index

namespace orc_bridge
{
  struct ChainIDs
  {
    static constexpr size_t TELOS_MAINNET = 40;
    static constexpr size_t TELOS_TESTNET = 41;
  };
  static constexpr auto WORD_SIZE       = 32u;
  // Constant chain ID determined at COMPILE time
  static constexpr size_t CURRENT_CHAIN_ID = ChainIDs::TELOS_TESTNET;
  static constexpr eosio::name ORACLE = eosio::name("delphioracle");
  static constexpr uint256_t GAS_LIMIT = 120000;
}