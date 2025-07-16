import { expect } from "chai";
import { ethers } from "hardhat";

describe("MintRedeem full flow", () => {
  let usdc: any, bvix: any, oracle: any, vault: any;
  let owner: any, user: any;

  beforeEach(async () => {
    [owner, user] = await ethers.getSigners();

    // MockUSDC (6-decimals) + fund user
    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy(owner.address);
    await usdc.connect(owner).mint(user.address, ethers.parseUnits("1000", 6)); // 1000 USDC

    // BVIX token
    const BVIX = await ethers.getContractFactory("BVIXToken");
    bvix = await BVIX.deploy(owner.address);

    // Oracle price = 42.15 * 1e18
    const MockOracle = await ethers.getContractFactory("MockOracle");
    oracle = await MockOracle.deploy(ethers.parseEther("42.15"));

    // Vault
    const MintRedeem = await ethers.getContractFactory("MintRedeem");
    vault = await MintRedeem.deploy(
      usdc.target,
      bvix.target,
      oracle.target,
      owner.address,
    );

    // Give vault mint rights
    await bvix.transferOwnership(vault.target);

    // User approves USDC spend
    await usdc
      .connect(user)
      .approve(vault.target, ethers.parseUnits("1000000", 6));
  });

  it("mints BVIX", async () => {
    await vault.connect(user).mint(ethers.parseUnits("1", 6)); // 1 USDC
    const bal = await bvix.balanceOf(user.address);
    expect(bal).to.be.gt(0n);
  });

  it("redeems BVIX", async () => {
    // mint first
    await vault.connect(user).mint(ethers.parseUnits("1", 6));
    const bvixBal = await bvix.balanceOf(user.address);

    // user approves burn
    await bvix.connect(user).approve(vault.target, bvixBal);
    await vault.connect(user).redeem(bvixBal);

    expect(await bvix.balanceOf(user.address)).to.equal(0n);
    expect(await usdc.balanceOf(user.address)).to.be.gt(
      ethers.parseUnits("0.99", 6), // after 0.3 % fee
    );
  });

  it("reverts on zero", async () => {
    await expect(vault.connect(user).mint(0)).to.be.revertedWith("amount = 0");
    await expect(vault.connect(user).redeem(0)).to.be.revertedWith(
      "amount = 0",
    );
  });
});
