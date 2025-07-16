// hardhat.config.cts
import "ts-node/register";
process.env.TS_NODE_PROJECT = "tsconfig.hardhat.json";   // ← add this line

import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: "0.8.21",
};
export default config;

