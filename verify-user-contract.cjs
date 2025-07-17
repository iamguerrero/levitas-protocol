const { ethers } = require("hardhat");

async function main() {
  const USER_USDC = "0xe18d3B075A241379D77fffE01eD1317ddA0e8bac";
  const [user] = await ethers.getSigners();
  
  console.log("=== VERIFYING USER'S CONTRACT ===");
  console.log("Contract address:", USER_USDC);
  console.log("User wallet:", user.address);
  
  // Get bytecode to check if contract exists
  const provider = ethers.provider;
  const code = await provider.getCode(USER_USDC);
  
  if (code === "0x") {
    console.log("❌ No contract found at this address");
    return;
  }
  
  console.log("✅ Contract exists");
  
  // Try different ABI approaches
  console.log("\n=== TRYING ERC20 ABI ===");
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)"
  ];
  
  try {
    const contract = new ethers.Contract(USER_USDC, ERC20_ABI, provider);
    const balance = await contract.balanceOf(user.address);
    const name = await contract.name();
    const symbol = await contract.symbol();
    const decimals = await contract.decimals();
    
    console.log("✅ ERC20 contract found!");
    console.log("Name:", name);
    console.log("Symbol:", symbol);
    console.log("Decimals:", decimals);
    console.log("Raw balance:", balance.toString());
    console.log("Formatted balance:", ethers.formatUnits(balance, decimals));
    
  } catch (error) {
    console.log("❌ Not a standard ERC20:", error.message);
  }
  
  // Check if it's on the right network
  console.log("\n=== NETWORK CHECK ===");
  const network = await provider.getNetwork();
  console.log("Current network:", network.name, "Chain ID:", network.chainId);
  console.log("Expected: Base Sepolia (Chain ID: 84532)");
}

main().catch(console.error);