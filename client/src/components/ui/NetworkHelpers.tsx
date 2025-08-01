import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Plus, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { switchToBaseSepolia } from "@/lib/web3";

export function NetworkHelpers() {
  const { toast } = useToast();

  const addBaseSepoliaNetwork = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "MetaMask Required",
          description: "Please install MetaMask to add the network.",
          variant: "destructive",
        });
        return;
      }

      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x14a34', // 84532 in hex
            chainName: 'Base Sepolia Testnet',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia.base.org'],
            blockExplorerUrls: ['https://sepolia.basescan.org'],
            iconUrls: ['https://base.org/favicon.ico'],
          },
        ],
      });

      toast({
        title: "Network Added!",
        description: "Base Sepolia testnet has been added to MetaMask.",
      });
    } catch (error: any) {
      console.error('Error adding network:', error);
      toast({
        title: "Failed to Add Network",
        description: error.message || "Please try adding the network manually.",
        variant: "destructive",
      });
    }
  };

  const openBaseFaucet = () => {
    window.open('https://docs.base.org/base-chain/tools/network-faucets', '_blank');
    toast({
      title: "Faucet Opened", 
      description: "Use your wallet address to get free testnet ETH.",
    });
  };

  const getTestUSDC = async () => {
    try {
      if (!window.ethereum) {
        toast({
          title: "Wallet Required",
          description: "Please connect MetaMask to get test USDC.",
          variant: "destructive",
        });
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // MockUSDC contract with faucet function
      const mockUSDCContract = new ethers.Contract(
        "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297",
        ["function faucet() external"],
        signer
      );

      toast({
        title: "Getting Test USDC...",
        description: "Transaction pending, please wait.",
      });

      const tx = await mockUSDCContract.faucet();
      await tx.wait();

      toast({
        title: "Success!",
        description: "You received 10,000 test USDC tokens!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get test USDC",
        variant: "destructive",
      });
    }
  };

  const getTestUSDCBase = async () => {
    try {
      await switchToBaseSepolia();
      
      if (!window.ethereum) {
        toast({
          title: "Wallet Required",
          description: "Please connect MetaMask to get test USDC.",
          variant: "destructive",
        });
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Use the Base Sepolia MockUSDC contract address
      const mockUSDCContract = new ethers.Contract(
        "0x9CC37B36FDd8CF5c0297BE15b75663Bf2a193297", // Base Sepolia MockUSDC address
        ["function faucet() external"],
        signer
      );

      toast({
        title: "Getting Test USDC...",
        description: "Transaction pending, please wait.",
      });

      const tx = await mockUSDCContract.faucet();
      await tx.wait();

      toast({
        title: "Success!",
        description: "You received 10,000 test USDC tokens!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to get test USDC",
        variant: "destructive",
      });
    }
  };

  

  return (
    <div className="w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Base Sepolia Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button
              onClick={addBaseSepoliaNetwork}
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Base Sepolia Testnet
            </Button>
            <Button
              onClick={openBaseFaucet}
              variant="outline"
              className="w-full justify-start"
            >
              <Coins className="w-4 h-4 mr-2" />
              Get Testnet ETH
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
            <Button
              onClick={getTestUSDCBase}
              variant="outline"
              className="w-full justify-start"
            >
              <Coins className="w-4 h-4 mr-2" />
              Get Test USDC
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Add the Base Sepolia testnet to MetaMask</p>
            <p>• Get free testnet ETH for transaction fees</p>
            <p>• Get test USDC tokens for minting</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}