import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Plus, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ethers } from "ethers";
import { switchToPolygonAmoy } from "@/lib/web3";

export function NetworkHelpers() {
  const { toast } = useToast();

  const addPolygonAmoyNetwork = async () => {
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
            chainId: '0x13882', // 80002 in hex
            chainName: 'Polygon Amoy Testnet',
            nativeCurrency: {
              name: 'MATIC',
              symbol: 'MATIC',
              decimals: 18,
            },
            rpcUrls: ['https://rpc-amoy.polygon.technology/'],
            blockExplorerUrls: ['https://amoy.polygonscan.com/'],
            iconUrls: ['https://polygon.technology/favicon.ico'],
          },
        ],
      });

      toast({
        title: "Network Added!",
        description: "Polygon Amoy testnet has been added to MetaMask.",
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

  const openPolygonFaucet = () => {
    window.open('https://faucet.polygon.technology/', '_blank');
    toast({
      title: "Faucet Opened", 
      description: "Use your wallet address to get free testnet MATIC.",
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
      
      // MockUSDC contract with faucet function - TODO: Update with Polygon Amoy address
      const mockUSDCContract = new ethers.Contract(
        "0x0000000000000000000000000000000000000000", // TODO: Deploy to Polygon Amoy
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
        description: error.message || "Failed to get test USDC. Deploy contracts first.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Polygon Amoy Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3">
            <Button
              onClick={addPolygonAmoyNetwork}
              variant="outline"
              className="w-full justify-start"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Polygon Amoy Testnet
            </Button>
            <Button
              onClick={openPolygonFaucet}
              variant="outline"
              className="w-full justify-start"
            >
              <Coins className="w-4 h-4 mr-2" />
              Get Testnet MATIC
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
            <Button
              onClick={getTestUSDC}
              variant="outline"
              className="w-full justify-start"
            >
              <Coins className="w-4 h-4 mr-2" />
              Get Test USDC
              <ExternalLink className="w-3 h-3 ml-auto" />
            </Button>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Add the Polygon Amoy testnet to MetaMask</p>
            <p>• Get free testnet MATIC for transaction fees</p>
            <p>• Get test USDC tokens for trading</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}