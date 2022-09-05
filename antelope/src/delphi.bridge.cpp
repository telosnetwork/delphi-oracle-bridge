#include "../include/delphi.bridge.hpp";

namespace orc_bridge
{
    //======================== admin actions ==========================
    // initialize the contract
    ACTION delphibridge::init(eosio::checksum160 evm_contract, string version, name admin){
        // authenticate
        require_auth(get_self());

        // validate
        check(!config_bridge.exists(), "contract already initialized");
        check(is_account(admin), "initial admin account doesn't exist");

        // initialize
        auto stored = config_bridge.get_or_create(get_self(), config_row);

        stored.version            = version;
        stored.admin              = admin;
        stored.evm_contract       = evm_contract;

        // Get the scope
        account_table accounts(EVM_SYSTEM_CONTRACT, EVM_SYSTEM_CONTRACT.value);
        auto accounts_byaddress = accounts.get_index<"byaddress"_n>();
        auto account = accounts_byaddress.require_find(pad160(evm_contract), "EVM bridge contract not found in eosio.evm Account");

        stored.evm_contract_scope       = account->index;

        config_bridge.set(stored, get_self());
    };

    // set the contract version
    ACTION delphibridge::setversion(string new_version){
        // authenticate
        require_auth(config_bridge.get().admin);

        auto stored = config_bridge.get();
        stored.version = new_version;

        // modify
        config_bridge.set(stored, get_self());
    };

    // set the bridge evm address
    ACTION delphibridge::setevmctc(eosio::checksum160 new_contract){
        // authenticate
        require_auth(config_bridge.get().admin);

        // Get the scope for accountstates
        account_table accounts(EVM_SYSTEM_CONTRACT, EVM_SYSTEM_CONTRACT.value);
        auto accounts_byaddress = accounts.get_index<"byaddress"_n>();
        auto account = accounts_byaddress.require_find(pad160(new_contract), "EVM bridge contract not found in eosio.evm Account table");

        // Save
        auto stored = config_bridge.get();
        stored.evm_contract = new_contract;
        stored.evm_contract_scope = account->index;

        config_bridge.set(stored, get_self());
    };

    // set new contract admin
    ACTION delphibridge::setadmin(name new_admin){
        // authenticate
        require_auth(config_bridge.get().admin);

        // check account exists
        check(is_account(new_admin), "New admin account does not exist, please verify the account name provided");

        auto stored = config_bridge.get();
        stored.admin = new_admin;
        // modify
        config_bridge.set(stored, get_self());
    };


    //======================== RNG Oracle actions ========================

    // request notification, checks for values in eosio.evm accountstate and adds a request
    ACTION delphibridge::reqnotify()
    {
        // open config singletons
        const auto conf = config_bridge.get();
        config_singleton_evm config_evm(EVM_SYSTEM_CONTRACT, EVM_SYSTEM_CONTRACT.value);
        const auto evm_conf = config_evm.get();

        // Define EVM tables
        account_state_table account_states(EVM_SYSTEM_CONTRACT, conf.evm_contract_scope);
        account_table _accounts(EVM_SYSTEM_CONTRACT, EVM_SYSTEM_CONTRACT.value);

        // find EVM account for this contract (if does not exist, you can create it via eosio.evm create action)
        const auto accounts_byaccount = _accounts.get_index<"byaccount"_n>();
        const auto account = accounts_byaccount.require_find(get_self().value, "Account not found");

        // Get our Requests array slot & find its length
        const auto account_states_bykey = account_states.get_index<"bykey"_n>();
        const auto storage_key = toChecksum256(uint256_t(STORAGE_INDEX));
        const auto array_length_checksum = account_states_bykey.require_find(storage_key, "No requests");
        check(array_length_checksum->value > 0, "No requests found");
        const auto array_slot = checksum256ToValue(keccak_256(storage_key.extract_as_byte_array()));

        // Get "to" address from config singleton
        const auto evm_contract = conf.evm_contract.extract_as_byte_array();
        std::vector<uint8_t> to;
        to.insert(to.end(),  evm_contract.begin(), evm_contract.end());
        const auto fnsig = toBin(FUNCTION_SIGNATURE);

        // Loop to make sure we do not miss requests
        for(uint256_t i = 0; i < array_length_checksum->value;i=i+1){
            const uint256_t array_length = array_length_checksum->value - i;
            // get call ID (uint) from EVM storage
            const auto call_id_checksum = account_states_bykey.find(getArrayMemberSlot(array_slot, 0, 8, array_length));
            const uint256_t call_id = (call_id_checksum == account_states_bykey.end()) ? uint256_t(0) : call_id_checksum->value;
            const std::vector<uint8_t> call_id_bs = pad(intx::to_byte_string(call_id), 32, true);

            // Get pair (string) from EVM storage (strings < 32b, as will be our case here for pairs, are stored as data + length)
            // To get string, we need to remove trailing 0 from the data part (using length)
            const auto pair_checksum = account_states_bykey.require_find(getArrayMemberSlot(array_slot, 5, 8, array_length), "Pair not found");
            const size_t pair_length = shrink<size_t>(pair_checksum->value.lo) / 2; // get length as size_t
            const std::vector<uint8_t> pair_length_bs = pad(intx::to_byte_string(uint256_t(pair_length)), 32, true);
            std::vector<uint8_t> pair = intx::to_byte_string(pair_checksum->value.hi);
            pair.resize(pair_length); // remove trailing 0

            // Get limit (uint) from EVM storage
            const auto limit_checksum = account_states_bykey.find(getArrayMemberSlot(array_slot, 4, 8, array_length));
            const auto limit = (limit_checksum == account_states_bykey.end()) ? 0 : limit_checksum->value;

            // Prepare solidity function data (function signature + arguments)
            std::vector<uint8_t> data;
            data.insert(data.end(), fnsig.begin(), fnsig.end());
            data.resize(sizeof(FUNCTION_SIGNATURE));
            data.insert(data.end(), call_id_bs.begin(), call_id_bs.end()); // Our first argument, call_id of the Request we are parsing

            // read table of delphi oracle to get datapoints
            datapointstable _datapoints(ORACLE, name(decodeHex(bin2hex(pair))).value);
            check(_datapoints.begin() != _datapoints.end(), "No datapoints found for this pair");

            delimitTupleArray<decltype(_datapoints)>(_datapoints, limit, &data);

            pair = pad(pair, 32, false);

            // tuple[] data
            uint64_t count = 0;
            for ( auto itr = _datapoints.begin(); itr != _datapoints.end() && count < limit; itr++ ) {

               delimitTupleArrayElement(&data);

               // Prepare remaining values
               auto owner = pad(intx::to_byte_string(itr->owner.value), 32, false);
               auto owner_string_length = pad(intx::to_byte_string(uint256_t(itr->owner.to_string().length())), 32, true); // owner string length
               std::vector<uint8_t> timestamp = pad(intx::to_byte_string(itr->timestamp.sec_since_epoch()), 32, true);
               std::vector<uint8_t> value = pad(intx::to_byte_string(itr->value), 32, true);
               std::vector<uint8_t> median = pad(intx::to_byte_string(itr->median), 32, true);

               // Append values
               data.insert(data.end(), timestamp.begin(), timestamp.end());
               data.insert(data.end(), value.begin(), value.end());
               data.insert(data.end(), median.begin(), median.end());
               data.insert(data.end(), pair_length_bs.begin(), pair_length_bs.end());
               data.insert(data.end(), pair.begin(), pair.end());
               data.insert(data.end(), owner_string_length.begin(), owner_string_length.end());
               data.insert(data.end(), owner.begin(), owner.end());

               count++;
            }

            // send back to EVM using eosio.evm
            action(
                permission_level {get_self(), "active"_n},
                EVM_SYSTEM_CONTRACT,
                "raw"_n,
                std::make_tuple(get_self(), rlp::encode(account->nonce, evm_conf.gas_price, GAS_LIMIT, to, uint256_t(0), data, CURRENT_CHAIN_ID, 0, 0),  false, std::optional<eosio::checksum160>(account->address))
            ).send();

        }
    };
}