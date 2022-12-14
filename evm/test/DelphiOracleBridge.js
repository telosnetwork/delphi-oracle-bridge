const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

const FEE = ethers.utils.parseEther('0.2');
const MAX_REQUESTS = 10;
const MAX_CALLBACK_GAS = 900000000;
const GAS_PRICE = 23610503242;
const PAIR = "tlosusd";

describe("DelphiOracleBridge", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, otherAccount] = await ethers.getSigners();

        const OracleBridge = await ethers.getContractFactory("DelphiOracleBridge");
        const OracleConsumer = await ethers.getContractFactory("DelphiOracleConsumer");
        let GasOracle = await ethers.getContractFactory("GasOracleBridge");
        gasOracle = await GasOracle.deploy(owner.address, GAS_PRICE)
        const bridge = await OracleBridge.deploy(FEE, MAX_REQUESTS, MAX_CALLBACK_GAS, owner.address, gasOracle.address);
        const consumer = await OracleConsumer.deploy(bridge.address);

        const datapoints = [
            {'pair': 'TLOSUSD', 'owner' : 'telosunlimited', 'value': ethers.utils.parseEther('1.0'), 'median': ethers.utils.parseEther('1.0'), 'timestamp': '1234567181' },
            {'pair': 'TLOSEOS', 'owner' : 'telosunlimited', 'value': ethers.utils.parseEther('2.0'), 'median': ethers.utils.parseEther('2.0'), 'timestamp': '1234567181' }
        ];
        return { bridge, consumer, owner, otherAccount, gasOracle, datapoints};
    }

    describe(":: Deployment", function () {
        it("Should set the right EVM contract", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(await bridge.oracle_evm_address()).to.equal(owner.address);
        });
        it("Should set the max requests", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(await bridge.max_requests()).to.equal(MAX_REQUESTS);
        });
        it("Should set the fee", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(await bridge.fee()).to.equal(FEE);
        });
    });

    describe(":: Setters", function () {
        it("Should let owner set the EVM contract", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(bridge.setOracleEvmAddress(otherAccount.address)).to.not.be.reverted;
            await expect(await bridge.oracle_evm_address()).to.equal(otherAccount.address);
        });
        it("Should not let any other account set the EVM contract", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(bridge.connect(otherAccount).setOracleEvmAddress(otherAccount.address)).to.be.reverted;
        });
        it("Should let owner set the max requests", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(bridge.setMaxRequests(MAX_REQUESTS + 1)).to.not.be.reverted;
            await expect(await bridge.max_requests()).to.equal(MAX_REQUESTS + 1);
        });
        it("Should not let any other account set the max requests", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(bridge.connect(otherAccount).setMaxRequests(MAX_REQUESTS + 1)).to.be.reverted;
        });
        it("Should let owner set the fee", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(bridge.setFee(FEE.mul(2))).to.not.be.reverted;
            await expect(await bridge.fee()).to.equal(FEE.mul(2));
        });
        it("Should not let any other account set the fee", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(bridge.connect(otherAccount).setFee(FEE.mul(2))).to.be.reverted;
        });
    });

    describe(":: Request price", function () {
        it("Should return the correct cost", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(await bridge.calculateRequestPrice(100000)).to.be.equal(FEE.add(100000 * GAS_PRICE));
        });
    });
    describe(":: Request", function () {
        it("Should accept valid new requests", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost})).to.not.be.reverted;
            await expect(await bridge.requestExists(otherAccount.address, 0)).to.not.be.reverted;
        });
        it("Should not accept new requests if no pairs are passed", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest([], 1, 100000, {value: cost})).to.be.reverted;
        });
        it("Should not accept new requests if limit is too high", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 200, 100000, {value: cost})).to.be.reverted;
        });
        it("Should not accept new requests if max request is reached", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            for(var i = 0; i < MAX_REQUESTS; i++){
                expect(await consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost})).to.not.be.reverted;
            }
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost})).to.be.reverted;
        });
        it("Should not accept new requests if wrong fee is passed", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: 0})).to.be.reverted;
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost.div(2) })).to.be.reverted;
        });
        it("Should be able to delete a request by id", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost})).to.not.be.reverted;
            await expect(await bridge.deleteRequest(0)).to.not.be.reverted;
            await expect(await bridge.requestExists(otherAccount.address, 0)).to.be.equal(false);
        });
        it("Should be able to delete a request by requestor and call id", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost})).to.not.be.reverted;
            await expect(await bridge.deleteRequestorRequest(consumer.address, 0)).to.not.be.reverted;
            await expect(await bridge.requestExists(consumer.address, 0)).to.be.equal(false);
        });
        it("Should emit a Requested event on valid request", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost})).to.emit(bridge, "Requested").withArgs(consumer.address, 0, PAIR);
            await expect(await bridge.requestExists(consumer.address, 0)).to.be.equal(true);
        });
    });

    describe(":: Response", function () {
        it("Should not accept response from an address other than the native bridge's contract evm address", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.makeRequest(PAIR, 1, 100000, {value: cost})).to.not.be.reverted;
            await expect(bridge.connect(otherAccount).reply(0, [{'pair': 'TLOSUSD', 'owner' : 'telosunlimited', 'value': ethers.utils.parseEther('1.0'), 'median': ethers.utils.parseEther('1.0'), 'timestamp': '1234567181' }])).to.be.reverted;
        });
        it("Should not accept response that does not have a request", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            await expect(bridge.connect(otherAccount).reply(0, [{'pair': 'TLOSUSD', 'owner' : 'telosunlimited', 'value': ethers.utils.parseEther('1.0'), 'median': ethers.utils.parseEther('1.0'), 'timestamp': '1234567181' }])).to.be.reverted;
        });
        it("Should not accept response that does not have datapoints", async function () {
            const { bridge, consumer, owner, otherAccount } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.makeRequest(PAIR, 1, 100000, {value: cost})).to.not.be.reverted;
            await expect(bridge.connect(otherAccount).reply(0, [])).to.be.reverted;
        });
        it("Should accept valid response and delete request", async function () {
            const { bridge, consumer, owner, otherAccount, datapoints } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(100000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 100000, {value: cost })).to.not.be.reverted;
            await expect(bridge.reply(0, datapoints)).to.not.be.reverted;
            await expect(await bridge.requestExists(otherAccount.address, 0)).to.equal(false);
        });
        it("Should emit a Replied event on valid reply", async function () {
            const { bridge, consumer, owner, otherAccount, datapoints } = await loadFixture(deployFixture);
            const cost = await bridge.calculateRequestPrice(75000);
            await expect(consumer.connect(otherAccount).makeRequest(PAIR, 1, 75000, {value: cost })).to.not.be.reverted;
            await expect(bridge.reply(0, datapoints)).to.emit(bridge, "Replied").withArgs(consumer.address, 0, PAIR);
        });
    });
});
