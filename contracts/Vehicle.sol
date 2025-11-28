// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Vehicle
 * @dev Smart contract for managing vehicle data and hazard alerts in V2V system
 */
contract Vehicle {
    
    struct VehicleData {
        string vehicleID;
        int256 latitude;      // Stored as lat * 1e6 (e.g., 40.7128 → 40712800)
        int256 longitude;     // Stored as lon * 1e6 (e.g., -74.0060 → -74006000)
        uint256 speed;        // Speed in km/h
        string status;        // "active", "inactive", "emergency"
        uint256 timestamp;
        address owner;
        bool isRegistered;
    }
    
    struct HazardReport {
        uint256 id;
        string vehicleID;
        string hazardType;    // "ice_patch", "accident", "debris", etc.
        int256 latitude;
        int256 longitude;
        uint256 confidence;   // 0-100 (percentage)
        uint256 timestamp;
        address reporter;
        uint256 confirmations;
        bool verified;
    }
    
    // State variables
    mapping(string => VehicleData) public vehicles;
    mapping(uint256 => HazardReport) public hazards;
    mapping(string => bool) public registeredVehicles;
    
    uint256 public hazardCount;
    uint256 public vehicleCount;
    
    address public owner;
    
    // Events
    event VehicleRegistered(string indexed vehicleID, address indexed owner, uint256 timestamp);
    event VehicleUpdated(string indexed vehicleID, int256 lat, int256 lon, uint256 speed, uint256 timestamp);
    event HazardReported(uint256 indexed hazardId, string indexed vehicleID, string hazardType, int256 lat, int256 lon, uint256 timestamp);
    event HazardVerified(uint256 indexed hazardId, uint256 confirmations);
    event VehicleStatusChanged(string indexed vehicleID, string newStatus);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }
    
    modifier onlyRegistered(string memory _vehicleID) {
        require(registeredVehicles[_vehicleID], "Vehicle not registered");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        hazardCount = 0;
        vehicleCount = 0;
    }
    
    /**
     * @dev Register a new vehicle in the system
     * @param _vehicleID Unique identifier for the vehicle
     */
    function registerVehicle(string memory _vehicleID) public {
        require(!registeredVehicles[_vehicleID], "Vehicle already registered");
        require(bytes(_vehicleID).length > 0, "Vehicle ID cannot be empty");
        
        vehicles[_vehicleID] = VehicleData({
            vehicleID: _vehicleID,
            latitude: 0,
            longitude: 0,
            speed: 0,
            status: "inactive",
            timestamp: block.timestamp,
            owner: msg.sender,
            isRegistered: true
        });
        
        registeredVehicles[_vehicleID] = true;
        vehicleCount++;
        
        emit VehicleRegistered(_vehicleID, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update vehicle location and speed
     * @param _vehicleID Vehicle identifier
     * @param _lat Latitude (multiplied by 1e6)
     * @param _lon Longitude (multiplied by 1e6)
     * @param _speed Speed in km/h
     */
    function updateLocation(
        string memory _vehicleID,
        int256 _lat,
        int256 _lon,
        uint256 _speed
    ) public onlyRegistered(_vehicleID) {
        VehicleData storage vehicle = vehicles[_vehicleID];
        
        vehicle.latitude = _lat;
        vehicle.longitude = _lon;
        vehicle.speed = _speed;
        vehicle.timestamp = block.timestamp;
        
        // Auto-update status based on speed
        if (_speed > 0 && keccak256(bytes(vehicle.status)) != keccak256(bytes("active"))) {
            vehicle.status = "active";
        } else if (_speed == 0 && keccak256(bytes(vehicle.status)) == keccak256(bytes("active"))) {
            vehicle.status = "inactive";
        }
        
        emit VehicleUpdated(_vehicleID, _lat, _lon, _speed, block.timestamp);
    }
    
    /**
     * @dev Report a hazard detected by a vehicle
     * @param _vehicleID Vehicle reporting the hazard
     * @param _hazardType Type of hazard
     * @param _lat Hazard latitude (multiplied by 1e6)
     * @param _lon Hazard longitude (multiplied by 1e6)
     * @param _confidence Confidence level (0-100)
     */
    function reportHazard(
        string memory _vehicleID,
        string memory _hazardType,
        int256 _lat,
        int256 _lon,
        uint256 _confidence
    ) public onlyRegistered(_vehicleID) returns (uint256) {
        require(_confidence <= 100, "Confidence must be 0-100");
        require(bytes(_hazardType).length > 0, "Hazard type cannot be empty");
        
        hazardCount++;
        
        hazards[hazardCount] = HazardReport({
            id: hazardCount,
            vehicleID: _vehicleID,
            hazardType: _hazardType,
            latitude: _lat,
            longitude: _lon,
            confidence: _confidence,
            timestamp: block.timestamp,
            reporter: msg.sender,
            confirmations: 1,
            verified: false
        });
        
        emit HazardReported(hazardCount, _vehicleID, _hazardType, _lat, _lon, block.timestamp);
        
        return hazardCount;
    }
    
    /**
     * @dev Confirm an existing hazard report
     * @param _hazardId ID of the hazard to confirm
     */
    function confirmHazard(uint256 _hazardId) public {
        require(_hazardId > 0 && _hazardId <= hazardCount, "Invalid hazard ID");
        
        HazardReport storage hazard = hazards[_hazardId];
        hazard.confirmations++;
        
        // Auto-verify if confirmations reach threshold
        if (hazard.confirmations >= 2 && !hazard.verified) {
            hazard.verified = true;
            emit HazardVerified(_hazardId, hazard.confirmations);
        }
    }
    
    /**
     * @dev Update vehicle status
     * @param _vehicleID Vehicle identifier
     * @param _status New status ("active", "inactive", "emergency")
     */
    function updateStatus(string memory _vehicleID, string memory _status) 
        public 
        onlyRegistered(_vehicleID) 
    {
        vehicles[_vehicleID].status = _status;
        vehicles[_vehicleID].timestamp = block.timestamp;
        
        emit VehicleStatusChanged(_vehicleID, _status);
    }
    
    /**
     * @dev Get vehicle data
     * @param _vehicleID Vehicle identifier
     */
    function getVehicle(string memory _vehicleID) 
        public 
        view 
        returns (
            string memory vehicleID,
            int256 latitude,
            int256 longitude,
            uint256 speed,
            string memory status,
            uint256 timestamp,
            address vehicleOwner
        ) 
    {
        VehicleData memory vehicle = vehicles[_vehicleID];
        return (
            vehicle.vehicleID,
            vehicle.latitude,
            vehicle.longitude,
            vehicle.speed,
            vehicle.status,
            vehicle.timestamp,
            vehicle.owner
        );
    }
    
    /**
     * @dev Get hazard report details
     * @param _hazardId Hazard identifier
     */
    function getHazard(uint256 _hazardId)
        public
        view
        returns (
            uint256 id,
            string memory vehicleID,
            string memory hazardType,
            int256 latitude,
            int256 longitude,
            uint256 confidence,
            uint256 timestamp,
            uint256 confirmations,
            bool verified
        )
    {
        HazardReport memory hazard = hazards[_hazardId];
        return (
            hazard.id,
            hazard.vehicleID,
            hazard.hazardType,
            hazard.latitude,
            hazard.longitude,
            hazard.confidence,
            hazard.timestamp,
            hazard.confirmations,
            hazard.verified
        );
    }
    
    /**
     * @dev Get total number of registered vehicles
     */
    function getTotalVehicles() public view returns (uint256) {
        return vehicleCount;
    }
    
    /**
     * @dev Get total number of hazard reports
     */
    function getTotalHazards() public view returns (uint256) {
        return hazardCount;
    }
}
