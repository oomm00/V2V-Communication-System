// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title NetworkManager
 * @dev Manages V2V communication rules, node authorization, and message relaying
 */
contract NetworkManager {
    
    struct Node {
        address nodeAddress;
        string nodeID;
        bool isAuthorized;
        uint256 registeredAt;
        uint256 messageCount;
        uint256 lastActivity;
    }
    
    struct Message {
        uint256 id;
        address from;
        address to;
        bytes data;
        uint256 timestamp;
        bool delivered;
        string messageType;
    }
    
    // State variables
    mapping(address => Node) public nodes;
    mapping(address => bool) public authorizedNodes;
    mapping(uint256 => Message) public messages;
    mapping(address => uint256[]) public nodeMessages;
    
    address public owner;
    uint256 public messageCount;
    uint256 public nodeCount;
    uint256 public maxMessageSize = 1024; // bytes
    
    // Events
    event NodeAuthorized(address indexed nodeAddress, string nodeID, uint256 timestamp);
    event NodeDeauthorized(address indexed nodeAddress, uint256 timestamp);
    event MessageRelayed(uint256 indexed messageId, address indexed from, address indexed to, uint256 timestamp);
    event MessageDelivered(uint256 indexed messageId, uint256 timestamp);
    event BroadcastMessage(uint256 indexed messageId, address indexed from, uint256 timestamp);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    modifier onlyAuthorized() {
        require(authorizedNodes[msg.sender], "Node not authorized");
        _;
    }
    
    constructor() {
        owner = msg.sender;
        messageCount = 0;
        nodeCount = 0;
    }
    
    /**
     * @dev Authorize a node to participate in the network
     * @param _nodeAddress Address of the node
     * @param _nodeID Unique identifier for the node
     */
    function authorizeNode(address _nodeAddress, string memory _nodeID) public onlyOwner {
        require(_nodeAddress != address(0), "Invalid node address");
        require(!authorizedNodes[_nodeAddress], "Node already authorized");
        require(bytes(_nodeID).length > 0, "Node ID cannot be empty");
        
        nodes[_nodeAddress] = Node({
            nodeAddress: _nodeAddress,
            nodeID: _nodeID,
            isAuthorized: true,
            registeredAt: block.timestamp,
            messageCount: 0,
            lastActivity: block.timestamp
        });
        
        authorizedNodes[_nodeAddress] = true;
        nodeCount++;
        
        emit NodeAuthorized(_nodeAddress, _nodeID, block.timestamp);
    }
    
    /**
     * @dev Deauthorize a node from the network
     * @param _nodeAddress Address of the node to deauthorize
     */
    function deauthorizeNode(address _nodeAddress) public onlyOwner {
        require(authorizedNodes[_nodeAddress], "Node not authorized");
        
        nodes[_nodeAddress].isAuthorized = false;
        authorizedNodes[_nodeAddress] = false;
        nodeCount--;
        
        emit NodeDeauthorized(_nodeAddress, block.timestamp);
    }
    
    /**
     * @dev Relay a message from one node to another
     * @param _to Recipient node address
     * @param _data Message data
     * @param _messageType Type of message (e.g., "hazard_alert", "location_update")
     */
    function relayMessage(
        address _to,
        bytes memory _data,
        string memory _messageType
    ) public onlyAuthorized returns (uint256) {
        require(_to != address(0), "Invalid recipient address");
        require(authorizedNodes[_to], "Recipient not authorized");
        require(_data.length <= maxMessageSize, "Message too large");
        require(_data.length > 0, "Message cannot be empty");
        
        messageCount++;
        
        messages[messageCount] = Message({
            id: messageCount,
            from: msg.sender,
            to: _to,
            data: _data,
            timestamp: block.timestamp,
            delivered: false,
            messageType: _messageType
        });
        
        // Update sender stats
        nodes[msg.sender].messageCount++;
        nodes[msg.sender].lastActivity = block.timestamp;
        
        // Track message for both sender and recipient
        nodeMessages[msg.sender].push(messageCount);
        nodeMessages[_to].push(messageCount);
        
        emit MessageRelayed(messageCount, msg.sender, _to, block.timestamp);
        
        return messageCount;
    }
    
    /**
     * @dev Broadcast a message to all authorized nodes
     * @param _data Message data
     * @param _messageType Type of message
     */
    function broadcastMessage(
        bytes memory _data,
        string memory _messageType
    ) public onlyAuthorized returns (uint256) {
        require(_data.length <= maxMessageSize, "Message too large");
        require(_data.length > 0, "Message cannot be empty");
        
        messageCount++;
        
        messages[messageCount] = Message({
            id: messageCount,
            from: msg.sender,
            to: address(0), // address(0) indicates broadcast
            data: _data,
            timestamp: block.timestamp,
            delivered: true, // Broadcasts are immediately "delivered"
            messageType: _messageType
        });
        
        // Update sender stats
        nodes[msg.sender].messageCount++;
        nodes[msg.sender].lastActivity = block.timestamp;
        
        nodeMessages[msg.sender].push(messageCount);
        
        emit BroadcastMessage(messageCount, msg.sender, block.timestamp);
        
        return messageCount;
    }
    
    /**
     * @dev Mark a message as delivered
     * @param _messageId ID of the message
     */
    function markMessageDelivered(uint256 _messageId) public onlyAuthorized {
        require(_messageId > 0 && _messageId <= messageCount, "Invalid message ID");
        
        Message storage message = messages[_messageId];
        require(message.to == msg.sender, "Only recipient can mark as delivered");
        require(!message.delivered, "Message already delivered");
        
        message.delivered = true;
        
        emit MessageDelivered(_messageId, block.timestamp);
    }
    
    /**
     * @dev Get message details
     * @param _messageId Message identifier
     */
    function getMessage(uint256 _messageId)
        public
        view
        returns (
            uint256 id,
            address from,
            address to,
            bytes memory data,
            uint256 timestamp,
            bool delivered,
            string memory messageType
        )
    {
        Message memory message = messages[_messageId];
        return (
            message.id,
            message.from,
            message.to,
            message.data,
            message.timestamp,
            message.delivered,
            message.messageType
        );
    }
    
    /**
     * @dev Get node details
     * @param _nodeAddress Node address
     */
    function getNode(address _nodeAddress)
        public
        view
        returns (
            string memory nodeID,
            bool isAuthorized,
            uint256 registeredAt,
            uint256 messageCount_,
            uint256 lastActivity
        )
    {
        Node memory node = nodes[_nodeAddress];
        return (
            node.nodeID,
            node.isAuthorized,
            node.registeredAt,
            node.messageCount,
            node.lastActivity
        );
    }
    
    /**
     * @dev Get all message IDs for a node
     * @param _nodeAddress Node address
     */
    function getNodeMessages(address _nodeAddress) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return nodeMessages[_nodeAddress];
    }
    
    /**
     * @dev Check if a node is authorized
     * @param _nodeAddress Node address to check
     */
    function isNodeAuthorized(address _nodeAddress) public view returns (bool) {
        return authorizedNodes[_nodeAddress];
    }
    
    /**
     * @dev Get total number of messages
     */
    function getTotalMessages() public view returns (uint256) {
        return messageCount;
    }
    
    /**
     * @dev Get total number of authorized nodes
     */
    function getTotalNodes() public view returns (uint256) {
        return nodeCount;
    }
    
    /**
     * @dev Update maximum message size
     * @param _newSize New maximum size in bytes
     */
    function setMaxMessageSize(uint256 _newSize) public onlyOwner {
        require(_newSize > 0, "Size must be greater than 0");
        maxMessageSize = _newSize;
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param _newOwner Address of the new owner
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        require(_newOwner != address(0), "Invalid new owner address");
        owner = _newOwner;
    }
}
