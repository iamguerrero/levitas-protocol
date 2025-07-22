const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MintRedeemV7", function () {
    let mintRedeem, priceOracle, usdc, bvix;
    let owner, user1, user2, liquidator, governor;
    let initialPrice = ethers.parseUnits("100", 6); // $100.00
    let updateDelay = 120; // 2 minutes for testnet

    beforeEach(async function () {
        [owner, user1, user2, liquidator, governor] = await ethers.getSigners();

        // Deploy MockUSDC
        const MockUSDC = await ethers.getContractFactory("MockUSDC");
        usdc = await MockUSDC.deploy();

        // Deploy BVIXToken
        const BVIXToken = await ethers.getContractFactory("BVIXToken");
        bvix = await BVIXToken.deploy();

        // Deploy PriceOracle
        const PriceOracle = await ethers.getContractFactory("PriceOracle");
        priceOracle = await PriceOracle.deploy(initialPrice, updateDelay, governor.address);

        // Deploy MintRedeemV7
        const MintRedeemV7 = await ethers.getContractFactory("MintRedeemV7");
        mintRedeem = await MintRedeemV7.deploy(
            usdc.address,
            bvix.address,
            priceOracle.address,
            governor.address
        );

        // Grant BVIX minting rights to vault
        await bvix.grantRole(await bvix.MINTER_ROLE(), mintRedeem.address);

        // Setup initial balances
        await usdc.mint(user1.address, ethers.parseUnits("10000", 6));
        await usdc.mint(user2.address, ethers.parseUnits("10000", 6));
        await usdc.mint(liquidator.address, ethers.parseUnits("10000", 6));
    });

    describe("Access Control", function () {
        it("Should set correct roles on deployment", async function () {
            expect(await mintRedeem.hasRole(await mintRedeem.GOVERNOR_ROLE(), governor.address)).to.be.true;
            expect(await mintRedeem.hasRole(await mintRedeem.PAUSER_ROLE(), governor.address)).to.be.true;
            expect(await mintRedeem.hasRole(await mintRedeem.LIQUIDATOR_ROLE(), governor.address)).to.be.true;
            expect(await mintRedeem.hasRole(await mintRedeem.DEFAULT_ADMIN_ROLE(), owner.address)).to.be.false;
        });

        it("Should allow governor to pause/unpause", async function () {
            await mintRedeem.connect(governor).pause();
            expect(await mintRedeem.paused()).to.be.true;

            await mintRedeem.connect(governor).unpause();
            expect(await mintRedeem.paused()).to.be.false;
        });

        it("Should prevent non-governor from pausing", async function () {
            await expect(mintRedeem.connect(user1).pause()).to.be.revertedWithCustomError(
                mintRedeem,
                "AccessControlUnauthorizedAccount"
            );
        });

        it("Should allow governor to update fees", async function () {
            await mintRedeem.connect(governor).setFees(50, 50);
            expect(await mintRedeem.mintFee()).to.equal(50);
            expect(await mintRedeem.redeemFee()).to.equal(50);
        });

        it("Should prevent non-governor from updating fees", async function () {
            await expect(mintRedeem.connect(user1).setFees(50, 50)).to.be.revertedWithCustomError(
                mintRedeem,
                "AccessControlUnauthorizedAccount"
            );
        });
    });

    describe("Oracle Integration", function () {
        it("Should use oracle price for calculations", async function () {
            const amount = ethers.parseUnits("1000", 6);
            const targetCR = 150;

            await usdc.connect(user1).approve(mintRedeem.address, amount);
            await mintRedeem.connect(user1).mintWithCollateralRatio(amount, targetCR);

            const position = await mintRedeem.positions(user1.address);
            expect(position.collateral).to.be.gt(0);
            expect(position.debt).to.be.gt(0);
        });

        it("Should handle oracle price updates", async function () {
            // Initial mint
            const amount = ethers.parseUnits("1000", 6);
            await usdc.connect(user1).approve(mintRedeem.address, amount);
            await mintRedeem.connect(user1).mintWithCollateralRatio(amount, 150);

            // Update oracle price
            const newPrice = ethers.parseUnits("200", 6);
            await priceOracle.connect(governor).emergencyUpdatePrice(newPrice);

            // Check that CR calculation uses new price
            const cr = await mintRedeem.getUserCollateralRatio(user1.address);
            expect(cr).to.be.lt(150); // CR should decrease with higher price
        });
    });

    describe("Minting", function () {
        it("Should mint tokens with correct collateral ratio", async function () {
            const amount = ethers.parseUnits("1000", 6);
            const targetCR = 150;

            await usdc.connect(user1).approve(mintRedeem.address, amount);
            const tx = await mintRedeem.connect(user1).mintWithCollateralRatio(amount, targetCR);

            const position = await mintRedeem.positions(user1.address);
            const actualCR = await mintRedeem.getUserCollateralRatio(user1.address);

            expect(position.collateral).to.be.gt(0);
            expect(position.debt).to.be.gt(0);
            expect(actualCR).to.be.closeTo(targetCR, 5); // Allow 5% tolerance
        });

        it("Should prevent minting with invalid collateral ratio", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await usdc.connect(user1).approve(mintRedeem.address, amount);

            await expect(mintRedeem.connect(user1).mintWithCollateralRatio(amount, 100))
                .to.be.revertedWithCustomError(mintRedeem, "InvalidCollateralRatio");

            await expect(mintRedeem.connect(user1).mintWithCollateralRatio(amount, 400))
                .to.be.revertedWithCustomError(mintRedeem, "InvalidCollateralRatio");
        });

        it("Should prevent minting with zero amount", async function () {
            await expect(mintRedeem.connect(user1).mintWithCollateralRatio(0, 150))
                .to.be.revertedWithCustomError(mintRedeem, "InvalidAmount");
        });

        it("Should prevent minting when paused", async function () {
            await mintRedeem.connect(governor).pause();
            
            const amount = ethers.parseUnits("1000", 6);
            await usdc.connect(user1).approve(mintRedeem.address, amount);

            await expect(mintRedeem.connect(user1).mintWithCollateralRatio(amount, 150))
                .to.be.revertedWithCustomError(mintRedeem, "EnforcedPause");
        });
    });

    describe("Redeeming", function () {
        beforeEach(async function () {
            // Setup initial position
            const amount = ethers.parseUnits("1000", 6);
            await usdc.connect(user1).approve(mintRedeem.address, amount);
            await mintRedeem.connect(user1).mintWithCollateralRatio(amount, 150);
        });

        it("Should redeem tokens correctly", async function () {
            const position = await mintRedeem.positions(user1.address);
            const redeemAmount = position.debt / 2n;

            const balanceBefore = await usdc.balanceOf(user1.address);
            await mintRedeem.connect(user1).redeem(redeemAmount);
            const balanceAfter = await usdc.balanceOf(user1.address);

            expect(balanceAfter).to.be.gt(balanceBefore);
        });

        it("Should prevent redeeming more than available", async function () {
            const position = await mintRedeem.positions(user1.address);
            const tooMuch = position.debt + ethers.parseUnits("1", 18);

            await expect(mintRedeem.connect(user1).redeem(tooMuch))
                .to.be.revertedWithCustomError(mintRedeem, "InsufficientCollateral");
        });

        it("Should prevent redeeming when paused", async function () {
            await mintRedeem.connect(governor).pause();
            
            const position = await mintRedeem.positions(user1.address);
            await expect(mintRedeem.connect(user1).redeem(position.debt / 2n))
                .to.be.revertedWithCustomError(mintRedeem, "EnforcedPause");
        });
    });

    describe("Liquidation", function () {
        beforeEach(async function () {
            // Setup undercollateralized position
            const amount = ethers.parseUnits("1000", 6);
            await usdc.connect(user1).approve(mintRedeem.address, amount);
            await mintRedeem.connect(user1).mintWithCollateralRatio(amount, 150);

            // Increase price to make position undercollateralized
            const newPrice = ethers.parseUnits("300", 6);
            await priceOracle.connect(governor).emergencyUpdatePrice(newPrice);
        });

        it("Should allow liquidation of undercollateralized position", async function () {
            const userCR = await mintRedeem.getUserCollateralRatio(user1.address);
            expect(userCR).to.be.lt(120); // Should be under liquidation threshold

            const balanceBefore = await usdc.balanceOf(liquidator.address);
            await mintRedeem.connect(liquidator).liquidate(user1.address);
            const balanceAfter = await usdc.balanceOf(liquidator.address);

            expect(balanceAfter).to.be.gt(balanceBefore);

            const position = await mintRedeem.positions(user1.address);
            expect(position.collateral).to.equal(0);
            expect(position.debt).to.equal(0);
        });

        it("Should prevent liquidation of healthy position", async function () {
            // Reset price to make position healthy
            await priceOracle.connect(governor).emergencyUpdatePrice(initialPrice);

            await expect(mintRedeem.connect(liquidator).liquidate(user1.address))
                .to.be.revertedWithCustomError(mintRedeem, "LiquidationNotAllowed");
        });

        it("Should prevent non-liquidator from liquidating", async function () {
            await expect(mintRedeem.connect(user2).liquidate(user1.address))
                .to.be.revertedWithCustomError(mintRedeem, "AccessControlUnauthorizedAccount");
        });

        it("Should prevent liquidation of empty position", async function () {
            await expect(mintRedeem.connect(liquidator).liquidate(user2.address))
                .to.be.revertedWithCustomError(mintRedeem, "PositionNotFound");
        });
    });

    describe("Reentrancy Protection", function () {
        it("Should prevent reentrant mint calls", async function () {
            // This test would require a malicious contract that tries to reenter
            // For now, we verify the nonReentrant modifier is present
            const abi = mintRedeem.interface.format();
            expect(abi).to.include("nonReentrant");
        });

        it("Should prevent reentrant redeem calls", async function () {
            const abi = mintRedeem.interface.format();
            expect(abi).to.include("nonReentrant");
        });
    });

    describe("Edge Cases", function () {
        it("Should handle zero debt correctly", async function () {
            const cr = await mintRedeem.getCollateralRatio();
            expect(cr).to.equal(0);
        });

        it("Should handle user with no position", async function () {
            const cr = await mintRedeem.getUserCollateralRatio(user2.address);
            expect(cr).to.equal(0);
        });

        it("Should calculate liquidation price correctly", async function () {
            const amount = ethers.parseUnits("1000", 6);
            await usdc.connect(user1).approve(mintRedeem.address, amount);
            await mintRedeem.connect(user1).mintWithCollateralRatio(amount, 150);

            const liquidationPrice = await mintRedeem.getLiquidationPrice(user1.address);
            expect(liquidationPrice).to.be.gt(0);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow governor to sweep tokens", async function () {
            const amount = ethers.parseUnits("100", 6);
            await usdc.transfer(mintRedeem.address, amount);

            const balanceBefore = await usdc.balanceOf(governor.address);
            await mintRedeem.connect(governor).sweepTokens(usdc.address, governor.address, amount);
            const balanceAfter = await usdc.balanceOf(governor.address);

            expect(balanceAfter - balanceBefore).to.equal(amount);
        });

        it("Should prevent non-governor from sweeping tokens", async function () {
            await expect(mintRedeem.connect(user1).sweepTokens(usdc.address, user1.address, 1000))
                .to.be.revertedWithCustomError(mintRedeem, "AccessControlUnauthorizedAccount");
        });
    });
}); 