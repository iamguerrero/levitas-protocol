const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🔄 Force Refreshing Frontend with New Oracle");
  console.log("=============================================");
  
  try {
    // Step 1: Update the ABI files to ensure they're current
    console.log("📝 Step 1: Regenerating ABI files...");
    
    const abiSourcePath = path.join(__dirname, '..', 'artifacts', 'contracts', 'EVIXOracle.sol', 'EVIXOracle.json');
    const abiTargetPath = path.join(__dirname, '..', 'client', 'src', 'contracts', 'EVIXOracle.abi.json');
    
    if (fs.existsSync(abiSourcePath)) {
      const artifact = JSON.parse(fs.readFileSync(abiSourcePath, 'utf8'));
      fs.writeFileSync(abiTargetPath, JSON.stringify(artifact.abi, null, 2));
      console.log("✅ EVIXOracle ABI updated");
    }
    
    // Step 2: Force update web3.ts with a timestamp comment to trigger reload
    console.log("📝 Step 2: Force updating web3.ts...");
    
    const web3Path = path.join(__dirname, '..', 'client', 'src', 'lib', 'web3.ts');
    let web3Content = fs.readFileSync(web3Path, 'utf8');
    
    // Add a timestamp comment to force reload
    const timestamp = new Date().toISOString();
    const timestampComment = `// Updated: ${timestamp} - New EVIX Oracle: 0xBd6E9809B9608eCAc3610cA65327735CC3c08104\n`;
    
    if (!web3Content.includes('// Updated:')) {
      web3Content = timestampComment + web3Content;
    } else {
      web3Content = web3Content.replace(/\/\/ Updated:.*\n/, timestampComment);
    }
    
    fs.writeFileSync(web3Path, web3Content);
    console.log("✅ web3.ts force updated");
    
    // Step 3: Clear any Node.js require cache (for development)
    console.log("🗑️  Step 3: Clearing require cache...");
    
    Object.keys(require.cache).forEach(key => {
      if (key.includes('web3.ts') || key.includes('EVIXOracle')) {
        delete require.cache[key];
      }
    });
    
    console.log("✅ Require cache cleared");
    
    // Step 4: Try to restart the frontend development server (if possible)
    console.log("🔄 Step 4: Instructions for frontend refresh...");
    
    console.log("\n🎯 FRONTEND REFRESH INSTRUCTIONS:");
    console.log("=================================");
    console.log("1. Stop your frontend development server (Ctrl+C)");
    console.log("2. Clear browser cache or hard refresh (Ctrl+Shift+R)");
    console.log("3. Restart your frontend server:");
    console.log("   cd client && npm run dev");
    console.log("");
    console.log("OR if using the full project:");
    console.log("   npm run dev");
    console.log("");
    console.log("4. The new EVIX Oracle address is: 0xBd6E9809B9608eCAc3610cA65327735CC3c08104");
    console.log("5. You should now see EVIX price: ~$38.35 (updating every minute)");
    
    // Step 5: Verify the addresses are correct
    console.log("\n📊 Step 5: Verifying current addresses...");
    
    const addressPattern = /evixOracle: "([^"]+)"/g;
    const matches = web3Content.match(addressPattern);
    
    if (matches) {
      matches.forEach(match => {
        console.log(`Found: ${match}`);
        if (match.includes('0xBd6E9809B9608eCAc3610cA65327735CC3c08104')) {
          console.log("✅ New EVIX Oracle address found in config");
        }
      });
    }
    
    console.log("\n🎉 Frontend refresh preparation complete!");
    console.log("Please restart your frontend development server and hard refresh your browser.");
    
  } catch (error) {
    console.error("❌ Frontend refresh failed:", error);
  }
}

main().catch(console.error); 