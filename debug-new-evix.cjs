const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Debugging new EVIX deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Debugging with account:", deployer.address);
  
  // New contract addresses
  const EVIX_ADDRESS = '0x667e594bD7B994c492cd973C805CEdd971a5F163';
  const EVIX_MINT_REDEEM_ADDRESS = '0x57C94a2C78ae5E3912617544b6446Ab0026267FD';
  const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
  const EVIX_ORACLE_ADDRESS = '0xCd7441A771a7F84E58d98E598B7Ff23A3688094F';
  
  try {
    // Get contracts
    const evixToken = await ethers.getContractAt("EVIXToken", EVIX_ADDRESS);
    const evixMintRedeem = await ethers.getContractAt("EVIXMintRedeemV5Simple", EVIX_MINT_REDEEM_ADDRESS);
    const mockUSDC = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
    const evixOracle = await ethers.getContractAt("PriceOracle", EVIX_ORACLE_ADDRESS);
    
    console.log("\n1. Checking EVIX Token...");
    const evixName = await evixToken.name();
    const evixSymbol = await evixToken.symbol();
    const evixDecimals = await evixToken.decimals();
    console.log("Name:", evixName);
    console.log("Symbol:", evixSymbol);
    console.log("Decimals:", evixDecimals);
    
    // Check MINTER_ROLE
    const MINTER_ROLE = await evixToken.MINTER_ROLE();
    console.log("MINTER_ROLE:", MINTER_ROLE);
    
    const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
    console.log("MintRedeem has MINTER_ROLE:", hasMinterRole);
    
    console.log("\n2. Checking EVIX MintRedeem...");
    const mintRedeemOwner = await evixMintRedeem.owner();
    console.log("MintRedeem owner:", mintRedeemOwner);
    console.log("Should be:", deployer.address);
    
    const usdcAddress = await evixMintRedeem.usdc();
    const evixAddress = await evixMintRedeem.evix();
    const oracleAddress = await evixMintRedeem.oracle();
    
    console.log("USDC address:", usdcAddress);
    console.log("EVIX address:", evixAddress);
    console.log("Oracle address:", oracleAddress);
    
    console.log("\n3. Checking Oracle...");
    const oraclePrice = await evixOracle.getPrice();
    console.log("Oracle price:", ethers.formatUnits(oraclePrice, 6));
    
    console.log("\n4. Checking USDC...");
    const deployerUsdcBalance = await mockUSDC.balanceOf(deployer.address);
    console.log("Deployer USDC balance:", ethers.formatUnits(deployerUsdcBalance, 6));
    
    // Check allowance
    const allowance = await mockUSDC.allowance(deployer.address, EVIX_MINT_REDEEM_ADDRESS);
    console.log("USDC allowance:", ethers.formatUnits(allowance, 6));
    
    console.log("\n5. Testing mint step by step...");
    
    // First, get some USDC if needed
    if (deployerUsdcBalance < ethers.parseUnits("100", 6)) {
      console.log("Getting test USDC...");
      const mintTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("1000", 6));
      await mintTx.wait();
      console.log("✅ Got test USDC");
    }
    
    // Set allowance
    if (allowance < ethers.parseUnits("100", 6)) {
      console.log("Setting USDC allowance...");
      const approveTx = await mockUSDC.approve(EVIX_MINT_REDEEM_ADDRESS, ethers.parseUnits("100", 6));
      await approveTx.wait();
      console.log("✅ USDC allowance set");
    }
    
    // Try static call first
    console.log("Testing mint with static call...");
    try {
      const staticResult = await evixMintRedeem.mint.staticCall(ethers.parseUnits("10", 6));
      console.log("✅ Static call successful, would mint:", ethers.formatEther(staticResult), "EVIX");
    } catch (staticError) {
      console.log("❌ Static call failed:", staticError.message);
      
      // Try to decode the error
      if (staticError.data) {
        console.log("Error data:", staticError.data);
      }
    }
    
    // Try actual mint
    console.log("Attempting actual mint...");
    try {
      const mintTx = await evixMintRedeem.mint(ethers.parseUnits("10", 6));
      await mintTx.wait();
      console.log("✅ Mint successful!");
      
      const evixBalance = await evixToken.balanceOf(deployer.address);
      console.log("EVIX balance after mint:", ethers.formatEther(evixBalance));
    } catch (mintError) {
      console.log("❌ Mint failed:", mintError.message);
      
      // Try to decode the error
      if (mintError.data) {
        console.log("Error data:", mintError.data);
      }
    }
    
  } catch (error) {
    console.error("❌ Error debugging:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 