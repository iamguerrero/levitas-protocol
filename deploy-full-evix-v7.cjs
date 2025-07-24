const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying full EVIX V7 ecosystem...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  // Update MOCK_USDC_ADDRESS if needed
  const MOCK_USDC_ADDRESS = "0x1a706D5BcB8eE5f9CD72F75a8cA7E12d238bfFdf";
  
  // Deploy fresh EVIX token and fixed MintRedeemV7
  console.log("\n�� Deploying fresh EVIX token...");
  const EVIXToken = await ethers.getContractFactory("EVIXToken");
  const evixToken = await EVIXToken.deploy(deployer.address);
  await evixToken.waitForDeployment();
  const evixTokenAddress = await evixToken.getAddress();
  console.log("✅ Fresh EVIX token deployed to:", evixTokenAddress);
  
  // Step 2: Deploy EVIX V7 MintRedeem
  console.log("\n📄 Deploying EVIXMintRedeemV7...");
  const EVIXMintRedeemV7 = await ethers.getContractFactory("EVIXMintRedeemV7");
  const evixMintRedeem = await EVIXMintRedeemV7.deploy(
    MOCK_USDC_ADDRESS,
    evixTokenAddress,
    "0xCd7441A771a7F84E58d98E598B7Ff23A3688094F", // Existing EVIX Oracle
    deployer.address // governor
  );
  await evixMintRedeem.waitForDeployment();
  const evixMintRedeemAddress = await evixMintRedeem.getAddress();
  console.log("✅ EVIXMintRedeemV7 deployed to:", evixMintRedeemAddress);
  
  // Step 3: Grant MINTER_ROLE
  console.log("\n🔑 Granting MINTER_ROLE...");
  const MINTER_ROLE = await evixToken.MINTER_ROLE();
  await evixToken.grantRole(MINTER_ROLE, evixMintRedeemAddress);
  console.log("✅ MINTER_ROLE granted");
  
  // Step 4: Test mint and redeem
  console.log("\n🧪 Testing mint and redeem...");
  const mockUSDC = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
  
  // Get USDC via faucet
  await mockUSDC.faucet();
  
  // Approve
  await mockUSDC.approve(evixMintRedeemAddress, ethers.parseUnits("100", 6));
  
  // Mint
  const mintTx = await evixMintRedeem.mintWithCollateralRatio(ethers.parseUnits("10000", 6), 150);
  await mintTx.wait();
  console.log("✅ Mint successful");
  
  // Check balance
  const evixBalance = await evixToken.balanceOf(deployer.address);
  console.log("EVIX balance:", ethers.formatEther(evixBalance));
  
  // Redeem half
  const redeemAmount = evixBalance / 2n;
  const redeemTx = await evixMintRedeem.redeem(redeemAmount);
  await redeemTx.wait();
  console.log("✅ Redeem successful");

  // Check CR
  const cr = await evixMintRedeem.getCollateralRatio();
  console.log("Collateral Ratio:", cr.toString());
  
  console.log("🎉 Everything works perfectly!");
  
  // Update configs
  console.log("Now updating frontend and backend configs...");
  // (Add code to update web3-secure-v7.ts and routes.ts)
}

main().catch(console.error); 