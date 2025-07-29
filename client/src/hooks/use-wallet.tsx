import { useState, useEffect, createContext, useContext } from "react";
import { useToast } from "@/hooks/use-toast";
import { switchToBaseSepolia } from "@/lib/web3";

interface WalletContextType {
  isConnected: boolean;
  address: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window.ethereum !== "undefined") {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
        }
      } catch (error) {

      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum === "undefined") {
      toast({
        title: "MetaMask Not Found",
        description: "Please install MetaMask to connect your wallet.",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);

    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setIsConnected(true);

        toast({
          title: "Wallet Connected",
          description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
        });

        // Check if on correct network (Base Sepolia) and switch if needed
        const chainId = await window.ethereum.request({
          method: "eth_chainId",
        });
        if (chainId !== "0x14a34") {
          // Base Sepolia chain ID
          try {
            await switchToBaseSepolia();
            toast({
              title: "Network Switched",
              description: "Successfully switched to Base Sepolia testnet.",
            });
          } catch (switchError) {
            toast({
              title: "Network Switch Failed",
              description:
                "Please manually switch to Base Sepolia testnet in MetaMask.",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  return (
    <WalletContext.Provider
      value={{
        isConnected,
        address,
        isConnecting,
        connectWallet,
        disconnect,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);

  if (context === undefined) {
    console.warn(
      "useWallet called outside of WalletProvider. Returning defaults.",
    );
    return {
      isConnected: false,
      address: null,
      isConnecting: false,
      connectWallet: async () => {
        console.warn("connectWallet called without WalletProvider");
      },
      disconnect: () => {
        console.warn("disconnect called without WalletProvider");
      },
    };
  }

  return context;
}
