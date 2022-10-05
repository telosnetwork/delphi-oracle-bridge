module.exports = async ({getNamedAccounts, deployments}) => {

    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    console.log(deployer)
    const bridge = await deploy('DelphiOracleBridge', {
        from: deployer,
        args: ["1000000000000000000", 10, "900000000" "0x6c33bdd2622e59fd10b411ff8d8d8d4dc5caf6ce", "0x648ac5a8c4E1ae5A93cd5BeDF143B095B8c49a2a"],
    });

    console.log("Bridge deployed to:", bridge.address);

    const consumer = await deploy('DelphiOracleConsumer', {
        from: deployer,
        args: [bridge.address],
    });

    console.log("Consumer deployed to:", consumer.address);

};
async loadTransfers()
{
    this.transfers = [];
    this.trx.logs.forEach(log => {
        log.topics.forEach(async (topic) => {
            // ERC20 & ERC721 transfers (ERC721 has 4 log topics for transfers, ERC20 has 3 log topics)
            if (TRANSFER_SIGNATURES.includes(log.topics[0].substr(0, 10))) {
                let contract = await this.$contractManager.getContract(log.address, (log.topics.length === 4) ? 'erc721' : 'erc20');
                if (typeof contract.token !== 'undefined' && contract.token !== null) {
                    let token = {'symbol': contract.token.symbol, 'address': log.address, name: contract.token.name}
                    if (log.topics.length === 4) {
                        if (contract.token.iERC721Metadata) {
                            try {
                                token = await this.$contractManager.loadTokenMetadata(log.address, token, BigNumber.from(log.topics[3]).toString());
                            } catch (e) {
                                console.error(`Could not retreive ERC721 Metadata for ${contract.address}: ${e.message}`)
                            }
                        }
                        this.erc721Transfers.push({
                            'tokenId': BigNumber.from(log.topics[3]).toString(),
                            'to': '0x' + log.topics[2].substr(log.topics[2].length - 40, 40),
                            'from': '0x' + log.topics[1].substr(log.topics[1].length - 40, 40),
                            'token': token
                        })
                    } else {
                        this.erc20Transfers.push({
                            'value': formatBN(log.data, contract.token.decimals, 5),
                            'to': '0x' + log.topics[2].substr(log.topics[2].length - 40, 40),
                            'from': '0x' + log.topics[1].substr(log.topics[1].length - 40, 40),
                            'token': token
                        })
                    }
                }
            }
        });
    });
},
module.exports.tags = ['DelphiOracleBridge'];