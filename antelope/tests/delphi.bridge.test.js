const { loadConfig, Blockchain } = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

describe("delphi.bridge", () => {
    let blockchain = new Blockchain(config);
    let bridge = blockchain.createAccount(`delphibridge`);
    let oracle = blockchain.createAccount(`delphioracle`);
    beforeAll(async () => {
        await oracle.setContract(blockchain.contractTemplates[oracle.accountName]);
        await oracle.updateAuth(`child`, `active`, {
            accounts: [
                {
                    permission: {
                        actor: oracle.accountName,
                        permission: `eosio.code`
                    },
                    weight: 1
                }
            ]
        });
        await oracle.contract.init({ app_name: `Delphi Oracle`, app_version: `3`, initial_admin: oracle.accountName });
        await bridge.setContract(blockchain.contractTemplates[bridge.accountName]);
        await bridge.updateAuth(`child`, `active`, {
            accounts: [
                {
                    permission: {
                        actor: bridge.accountName,
                        permission: `eosio.code`
                    },
                    weight: 1
                }
            ]
        });
    });
    beforeEach(async () => {
        await bridge.resetTables();
        await bridge.contract.init({evm_contract: `9a469d1e668425907548228EA525A661FF3BFa2B`, version: `1`, admin: bridge.accountName, oracle: oracle.accountName, function_signature: `0dF31700`});
    });
    describe(":: Setters", () => {
        it("can set a new admin", async () => {
            const txTrace = await bridge.contract.setadmin({new_admin: `rngorc.brdg`});
        });

        it("can set a new version", async () => {
            const txTrace = await bridge.contract.setversion({ new_version: `2`});
        });

        it("can set a new evm contract", async () => {
            const txTrace = await bridge.contract.setevmctc({new_contract: `9a469d1e668425907548228EA525A661FF3BFa2B`});
        });
    });
    describe(":: Request", () => {
        it("can create a new request", async () => {
            const txTrace = await bridge.contract.requestrand({call_id: "01", seed: "01", caller: "9a469d1e668425907548228EA525A661FF3BFa2B", max: "64", min: "02"});
            // get all print output of the transfer action and its created notifications
            const consoleOutput = txTrace.action_traces;
            // print it to test runner's stdout
            console.log(consoleOutput);
        });
        it("can remove that request", async () => {
            const txTrace = await bridge.contract.rmvrequest({request_id: 1});
        });
        it("can reply to that request", async () => {
            const txTrace = await bridge.contract.receiverand({caller_id: 1, random: `01CEB0B8823B9F16B3B99EDAC901C04C72046880169264B20242A0F6DB23DDB6`});
        });
    });
});
