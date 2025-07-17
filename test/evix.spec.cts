import { expect } from "chai";
import { ethers } from "hardhat";

describe("EVIX Token Test", () => {
  let usdc: any, evix: any, oracle: any, vault: any;
  let owner: any, user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // MockUSDC (6-decimals) + fund user
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy(owner.address);
    await usdc.connect(owner).mint(user.address, ethers.parseUnits("1000", 6)); // 1000 USDC

    // EVIX token
    const EVIX = await ethers.getContractFactory("EVIXToken");
    evix = await EVIX.deploy(owner.address);

    // Oracle price = 37.98 * 1e18
    const MockOracle = await ethers.getContractFactory("MockOracle");
    oracle = await MockOracle.deploy(ethers.parseEther("37.98"));

    // Vault
    const MintRedeem = await ethers.getContractFactory("MintRedeem");
    vault = await MintRedeem.deploy(
      usdc.target,
      evix.target,
      oracle.target,
      owner.address,
    );

    // Give vault mint rights
    await evix.transferOwnership(vault.target);

    // User approves USDC spend
    await usdc
      .connect(user)
      .approve(vault.target, ethers.parseUnits("1000000", 6));
  });

  it("mints EVIX", async () => {
    await vault.connect(user).mint(ethers.parseUnits("1", 6)); // 1 USDC
    const bal = await evix.balanceOf(user.address);
    expect(bal).to.be.gt(0n);
  });

  it("reverts on zero", async () => {
    await expect(vault.connect(user).mint(0)).to.be.revertedWith("amount = 0");
  });
});
