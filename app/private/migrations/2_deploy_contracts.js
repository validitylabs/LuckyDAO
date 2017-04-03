var LuckyDAO = artifacts.require("./LuckyDAO.sol");

module.exports = function(deployer, network) {
  deployer.deploy(LuckyDAO, 1500000000, "0x41c0b08962537ca31457eaee11e23f155a3c00f4", 2);
};
