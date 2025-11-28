const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Vehicle Contract", function () {
  let vehicle;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const Vehicle = await ethers.getContractFactory("Vehicle");
    vehicle = await Vehicle.deploy();
    await vehicle.waitForDeployment();
  });

  describe("Vehicle Registration", function () {
    it("Should register a new vehicle", async function () {
      await vehicle.registerVehicle("car001");
      const vehicleData = await vehicle.getVehicle("car001");
      expect(vehicleData[0]).to.equal("car001");
      expect(vehicleData[4]).to.equal("inactive");
    });

    it("Should not allow duplicate registration", async function () {
      await vehicle.registerVehicle("car001");
      await expect(vehicle.registerVehicle("car001")).to.be.revertedWith(
        "Vehicle already registered"
      );
    });

    it("Should increment vehicle count", async function () {
      await vehicle.registerVehicle("car001");
      await vehicle.registerVehicle("car002");
      const count = await vehicle.getTotalVehicles();
      expect(count).to.equal(2);
    });
  });

  describe("Location Updates", function () {
    beforeEach(async function () {
      await vehicle.registerVehicle("car001");
    });

    it("Should update vehicle location", async function () {
      await vehicle.updateLocation("car001", 40712800, -74006000, 60);
      const vehicleData = await vehicle.getVehicle("car001");
      expect(vehicleData[1]).to.equal(40712800); // latitude
      expect(vehicleData[2]).to.equal(-74006000); // longitude
      expect(vehicleData[3]).to.equal(60); // speed
    });

    it("Should update status to active when moving", async function () {
      await vehicle.updateLocation("car001", 40712800, -74006000, 60);
      const vehicleData = await vehicle.getVehicle("car001");
      expect(vehicleData[4]).to.equal("active");
    });

    it("Should not allow unregistered vehicle to update", async function () {
      await expect(
        vehicle.updateLocation("car999", 40712800, -74006000, 60)
      ).to.be.revertedWith("Vehicle not registered");
    });
  });

  describe("Hazard Reporting", function () {
    beforeEach(async function () {
      await vehicle.registerVehicle("car001");
    });

    it("Should report a hazard", async function () {
      await vehicle.reportHazard("car001", "ice_patch", 40712800, -74006000, 85);
      const hazard = await vehicle.getHazard(1);
      expect(hazard[1]).to.equal("car001");
      expect(hazard[2]).to.equal("ice_patch");
      expect(hazard[5]).to.equal(85); // confidence
    });

    it("Should increment hazard count", async function () {
      await vehicle.reportHazard("car001", "ice_patch", 40712800, -74006000, 85);
      await vehicle.reportHazard("car001", "debris", 40712900, -74006100, 90);
      const count = await vehicle.getTotalHazards();
      expect(count).to.equal(2);
    });

    it("Should not allow confidence > 100", async function () {
      await expect(
        vehicle.reportHazard("car001", "ice_patch", 40712800, -74006000, 150)
      ).to.be.revertedWith("Confidence must be 0-100");
    });

    it("Should emit HazardReported event", async function () {
      await expect(
        vehicle.reportHazard("car001", "ice_patch", 40712800, -74006000, 85)
      )
        .to.emit(vehicle, "HazardReported")
        .withArgs(1, "car001", "ice_patch", 40712800, -74006000, await ethers.provider.getBlock("latest").then(b => b.timestamp + 1));
    });
  });

  describe("Hazard Confirmation", function () {
    beforeEach(async function () {
      await vehicle.registerVehicle("car001");
      await vehicle.reportHazard("car001", "ice_patch", 40712800, -74006000, 85);
    });

    it("Should confirm a hazard", async function () {
      await vehicle.confirmHazard(1);
      const hazard = await vehicle.getHazard(1);
      expect(hazard[7]).to.equal(2); // confirmations
      expect(hazard[8]).to.equal(true); // verified
    });

    it("Should auto-verify after 2 confirmations", async function () {
      await vehicle.confirmHazard(1);
      const hazard = await vehicle.getHazard(1);
      expect(hazard[8]).to.equal(true);
    });
  });
});
