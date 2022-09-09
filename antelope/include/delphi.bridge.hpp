// @author Thomas Cuvillier
// @contract delphibridge
// @version v0.1.0

#include <vector>

// EOSIO
#include <eosio/eosio.hpp>
#include <eosio/singleton.hpp>
#include <eosio/crypto.hpp>

// EXTERNAL
#include <intx/base.hpp>
#include <rlp/rlp.hpp>
#include <ecc/uECC.c>
#include <keccak256/k.c>
#include <boost/multiprecision/cpp_int.hpp>

// TELOS EVM
#include <constants.hpp>
#include <util.hpp>
#include <datastream.hpp>
#include <tables.hpp>

#define EVM_SYSTEM_CONTRACT name("eosio.evm")

using namespace std;
using namespace eosio;
using namespace orc_bridge;
using namespace evm_util;

namespace orc_bridge
{
    class [[eosio::contract("delphibridge")]] delphibridge : public contract {
        public:
            config_singleton_bridge config_bridge;
            using contract::contract;
            delphibridge(name self, name code, datastream<const char*> ds) : contract(self, code, ds), config_bridge(self, self.value) { };
            ~delphibridge() {};

            //======================== Admin actions ========================
            // intialize the contract
            ACTION init(eosio::checksum160 evm_contract, string version, name admin);

            //set the contract version
            ACTION setversion(string new_version);

            //set the bridge evm address
            ACTION setevmctc(eosio::checksum160 new_contract);

            //set new contract admin
            ACTION setadmin(name new_admin);

            //======================== Delphi Oracle actions ========================
            ACTION reqnotify();

    };
}