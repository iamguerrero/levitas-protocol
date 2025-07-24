const { ethers } = require("hardhat");

async function main() {
  console.log("🧪 Testing simple EVIX deployment...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Testing with account:", deployer.address);
  
  // Latest contract addresses
  const EVIX_ADDRESS = '0x6C3e986c4cc7b3400de732440fa01B66FF9172Cf';
  const EVIX_MINT_REDEEM_ADDRESS = '0x88cCC6e9Dc7f5c857f77863719BD9DEB7dfd9948';
  const MOCK_USDC_ADDRESS = '0x79640e0f510a7c6d59737442649d9600C84b035f';
  const EVIX_ORACLE_ADDRESS = '0xCd7441A771a7F84E58d98E598B7Ff23A3688094F';
  
  try {
    // Get contracts
    const evixToken = await ethers.getContractAt("EVIXToken", EVIX_ADDRESS);
    const evixMintRedeem = await ethers.getContractAt("EVIXMintRedeemSimple", EVIX_MINT_REDEEM_ADDRESS);
    const mockUSDC = await ethers.getContractAt("MockUSDC", MOCK_USDC_ADDRESS);
    const evixOracle = await ethers.getContractAt("PriceOracle", EVIX_ORACLE_ADDRESS);
    
    console.log("\n1. Basic contract checks...");
    console.log("EVIX Token address:", EVIX_ADDRESS);
    console.log("EVIX MintRedeem address:", EVIX_MINT_REDEEM_ADDRESS);
    
    // Check EVIX token
    const evixName = await evixToken.name();
    console.log("EVIX Token name:", evixName);
    
    // Check MINTER_ROLE
    const MINTER_ROLE = await evixToken.MINTER_ROLE();
    const hasMinterRole = await evixToken.hasRole(MINTER_ROLE, EVIX_MINT_REDEEM_ADDRESS);
    console.log("MintRedeem has MINTER_ROLE:", hasMinterRole);
    
    // Check oracle
    const oraclePrice = await evixOracle.getPrice();
    console.log("Oracle price:", ethers.formatUnits(oraclePrice, 6));
    
    // Check USDC balance and allowance
    const usdcBalance = await mockUSDC.balanceOf(deployer.address);
    console.log("USDC balance:", ethers.formatUnits(usdcBalance, 6));
    
    const allowance = await mockUSDC.allowance(deployer.address, EVIX_MINT_REDEEM_ADDRESS);
    console.log("USDC allowance:", ethers.formatUnits(allowance, 6));
    
    // Get USDC if needed
    if (usdcBalance < ethers.parseUnits("100", 6)) {
      console.log("Getting test USDC...");
      const mintTx = await mockUSDC.mint(deployer.address, ethers.parseUnits("1000", 6));
      await mintTx.wait();
      console.log("✅ Got test USDC");
    }
    
    // Set allowance if needed
    if (allowance < ethers.parseUnits("100", 6)) {
      console.log("Setting USDC allowance...");
      const approveTx = await mockUSDC.approve(EVIX_MINT_REDEEM_ADDRESS, ethers.parseUnits("100", 6));
      await approveTx.wait();
      console.log("✅ USDC allowance set");
    }
    
    console.log("\n2. Testing mint step by step...");
    
    // Test with a small amount first
    const testAmount = ethers.parseUnits("10", 6); // 10 USDC
    
    console.log("Testing mint with 10 USDC...");
    console.log("Oracle price:", ethers.formatUnits(oraclePrice, 6));
    
    // Calculate expected EVIX
    const fee = (testAmount * 30) / 10000; // 0.30% fee
    const netAmount = testAmount - fee;
    const expectedEvix = (netAmount * ethers.parseUnits("1", 18)) / oraclePrice;
    console.log("Expected EVIX to mint:", ethers.formatEther(expectedEvix));
    
    // Try static call first
    try {
      const staticResult = await evixMintRedeem.mint.staticCall(testAmount);
      console.log("✅ Static call successful, would mint:", ethers.formatEther(staticResult), "EVIX");
      
      // If static call works, try actual mint
      console.log("Attempting actual mint...");
      const mintTx = await evixMintRedeem.mint(testAmount);
      await mintTx.wait();
      console.log("✅ Mint successful!");
      
      const evixBalance = await evixToken.balanceOf(deployer.address);
      console.log("EVIX balance after mint:", ethers.formatEther(evixBalance));
      
    } catch (error) {
      console.log("❌ Error:", error.message);
      
      // Try to get more details about the error
      if (error.data) {
        console.log("Error data:", error.data);
      }
      
      // Try to decode the error
      try {
        const iface = new ethers.Interface([
          "error TransferFailed()",
          "error InsufficientBalance()",
          "error AmountTooSmall()",
          "error InvalidPrice()"
        ]);
        const decoded = iface.parseError(error.data);
        console.log("Decoded error:", decoded.name);
      } catch (decodeError) {
        console.log("Could not decode error");
      }
    }
    
  } catch (error) {
    console.error("❌ Error in test:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 