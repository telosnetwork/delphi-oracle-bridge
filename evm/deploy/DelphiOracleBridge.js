module.exports = async ({getNamedAccounts, deployments}) => {

    const {deploy} = deployments;
    const {deployer} = await getNamedAccounts();
    console.log(deployer)
    const bridge = await deploy('DelphiOracleBridge', {
        from: deployer,
        args: ["1000000000000000000", 10, "0x6c33bdd2622e59fd10b411ff8d8d8d4dc5caf6ce", "0x648ac5a8c4E1ae5A93cd5BeDF143B095B8c49a2a"],
    });

    console.log("Bridge deployed to:", bridge.address);

    const consumer = await deploy('DelphiOracleConsumer', {
        from: deployer,
        args: [bridge.address],
    });

    console.log("Consumer deployed to:", consumer.address);

};
module.exports.tags = ['DelphiOracleBridge'];