import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("SupplyChain", function () {
  async function deployFixture() {
    const [manufacturer, buyer, outsider] = await ethers.getSigners();
    const SupplyChain = await ethers.getContractFactory("SupplyChain");
    const supplyChain = await SupplyChain.deploy();
    await supplyChain.waitForDeployment();
    return { supplyChain, manufacturer, buyer, outsider };
  }

  it("createProduct creates with correct owner and Manufactured stage", async function () {
    const { supplyChain, manufacturer } = await deployFixture();

    await expect(supplyChain.connect(manufacturer).createProduct("Widget", "Sample product"))
      .to.emit(supplyChain, "ProductCreated")
      .withArgs(0n, "Widget", manufacturer.address);

    const product = await supplyChain.getProduct(0);
    expect(product.name).to.equal("Widget");
    expect(product.description).to.equal("Sample product");
    expect(product.currentOwner).to.equal(manufacturer.address);
    expect(product.currentStage).to.equal(0n);
    expect(product.manufacturer).to.equal(manufacturer.address);
  });

  it("transferProduct updates owner, stage, and appends to history", async function () {
    const { supplyChain, manufacturer, buyer } = await deployFixture();

    await supplyChain.connect(manufacturer).createProduct("Widget", "Sample product");
    await expect(
      supplyChain.connect(manufacturer).transferProduct(
        0,
        buyer.address,
        3,
        "Warehouse A"
      )
    )
      .to.emit(supplyChain, "ProductTransferred")
      .withArgs(0n, manufacturer.address, buyer.address, 3);

    const product = await supplyChain.getProduct(0);
    expect(product.currentOwner).to.equal(buyer.address);
    expect(product.currentStage).to.equal(3n);

    const history = await supplyChain.getProductHistory(0);
    expect(history).to.have.lengthOf(2);
    expect(history[0].actor).to.equal(manufacturer.address);
    expect(history[0].location).to.equal("Manufacturer");
    expect(history[1].actor).to.equal(manufacturer.address);
    expect(history[1].location).to.equal("Warehouse A");
    expect(history[1].stage).to.equal(3n);
  });

  it("non-owner cannot call transferProduct", async function () {
    const { supplyChain, manufacturer, outsider, buyer } = await deployFixture();

    await supplyChain.connect(manufacturer).createProduct("Widget", "Sample product");

    await expect(
      supplyChain.connect(outsider).transferProduct(
        0,
        buyer.address,
        2,
        "Checkpoint"
      )
    ).to.be.revertedWith("Caller is not product owner");
  });

  it("getProductHistory returns correct number of entries", async function () {
    const { supplyChain, manufacturer, buyer } = await deployFixture();

    await supplyChain.connect(manufacturer).createProduct("Widget", "Sample product");
    await supplyChain.connect(manufacturer).transferProduct(0, buyer.address, 3, "Warehouse A");
    await supplyChain.connect(buyer).transferProduct(0, manufacturer.address, 6, "Retail Store");

    const history = await supplyChain.getProductHistory(0);
    expect(history).to.have.lengthOf(3);
  });

  it("getProductsByOwner returns correct IDs after transfers", async function () {
    const { supplyChain, manufacturer, buyer } = await deployFixture();

    await supplyChain.connect(manufacturer).createProduct("Widget", "Sample product");
    await supplyChain.connect(manufacturer).transferProduct(0, buyer.address, 3, "Warehouse A");

    const manufacturerProducts = await supplyChain.getProductsByOwner(manufacturer.address);
    const buyerProducts = await supplyChain.getProductsByOwner(buyer.address);

    expect(manufacturerProducts).to.deep.equal([]);
    expect(buyerProducts).to.deep.equal([0n]);
  });
});
