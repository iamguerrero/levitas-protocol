import pkg from 'hardhat';
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const MintRedeemV6 = await ethers.getContractFactory("MintRedeemV6");
  const bvixV6 = await MintRedeemV6.deploy(
    "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297", // MockUSDC
    "0xdcCCCC3A977cC0166788265eD4B683D41f3AED09", // BVIXToken
    "0x85485dD6cFaF5220150c413309C61a8EA24d24FE", // MockOracle
    deployer.address
  );
  await bvixV6.waitForDeployment();
  console.log("BVIX MintRedeemV6:", await bvixV6.getAddress());

  const EVIXMintRedeemV6 = await ethers.getContractFactory("EVIXMintRedeemV6");
  const evixV6 = await EVIXMintRedeemV6.deploy(
    "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297", // MockUSDC
    "0x089C132BC246bF2060F40B0608Cb14b2A0cC9127", // EVIXToken
    "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F", // EVIXOracle
    deployer.address
  );
  await evixV6.waitForDeployment();
  console.log("EVIX MintRedeemV6:", await evixV6.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
