// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ClimateInsurance
 * @dev Smart contract for automated climate event insurance payouts
 * Supports micro-insurance for farmers based on verified climate events
 */
contract ClimateInsurance {
    // Events
    event EventRegistered(bytes32 indexed eventId, address indexed reporter, string eventType);
    event EventVerified(bytes32 indexed eventId, address indexed verifier);
    event PayoutProcessed(bytes32 indexed eventId, address indexed recipient, uint256 amount);
    event PolicyCreated(address indexed user, uint256 premium, uint256 coverage);
    event BalanceWithdrawn(address indexed user, uint256 amount);

    // Structs
    struct ClimateEvent {
        address reporter;
        string eventType;
        uint256 timestamp;
        bool verified;
        bool payoutProcessed;
        uint256 payoutAmount;
        string metaData; // JSON string with lat/lng, description, etc.
    }

    struct InsurancePolicy {
        uint256 premium;
        uint256 coverage;
        uint256 startDate;
        uint256 endDate;
        bool active;
        uint256 claimsCount;
    }

    // State variables
    mapping(bytes32 => ClimateEvent) public events;
    mapping(address => InsurancePolicy) public policies;
    mapping(address => uint256) public userBalances;
    mapping(address => bool) public verifiers;
    
    address public owner;
    uint256 public totalPoolFunds;
    uint256 public constant MIN_PAYOUT = 0.001 ether; // Minimum payout amount
    uint256 public constant MAX_PAYOUT = 0.1 ether;   // Maximum payout amount
    uint256 public constant PREMIUM_RATE = 0.01 ether; // Annual premium

    // Payout amounts by event type and severity
    mapping(string => mapping(string => uint256)) public payoutMatrix;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyVerifier() {
        require(verifiers[msg.sender] || msg.sender == owner, "Only verifiers can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
        verifiers[owner] = true;
        
        // Initialize payout matrix
        initializePayoutMatrix();
    }

    /**
     * @dev Initialize the payout matrix for different event types and severities
     */
    function initializePayoutMatrix() internal {
        // Drought payouts
        payoutMatrix["drought"]["low"] = 0.005 ether;
        payoutMatrix["drought"]["medium"] = 0.015 ether;
        payoutMatrix["drought"]["high"] = 0.03 ether;
        
        // Flood payouts
        payoutMatrix["flood"]["low"] = 0.01 ether;
        payoutMatrix["flood"]["medium"] = 0.025 ether;
        payoutMatrix["flood"]["high"] = 0.05 ether;
        
        // Locust payouts
        payoutMatrix["locust"]["low"] = 0.008 ether;
        payoutMatrix["locust"]["medium"] = 0.02 ether;
        payoutMatrix["locust"]["high"] = 0.04 ether;
        
        // Extreme heat payouts
        payoutMatrix["extreme_heat"]["low"] = 0.005 ether;
        payoutMatrix["extreme_heat"]["medium"] = 0.012 ether;
        payoutMatrix["extreme_heat"]["high"] = 0.025 ether;
    }

    /**
     * @dev Register a new climate event
     * @param eventId Unique identifier for the event
     * @param eventType Type of climate event (drought, flood, etc.)
     * @param metaData JSON metadata including location, description, etc.
     */
    function registerEvent(
        bytes32 eventId,
        string memory eventType,
        string memory metaData
    ) external {
        require(events[eventId].reporter == address(0), "Event already registered");
        
        events[eventId] = ClimateEvent({
            reporter: msg.sender,
            eventType: eventType,
            timestamp: block.timestamp,
            verified: false,
            payoutProcessed: false,
            payoutAmount: 0,
            metaData: metaData
        });

        emit EventRegistered(eventId, msg.sender, eventType);
    }

    /**
     * @dev Verify a climate event (only verifiers)
     * @param eventId The event to verify
     * @param severity Severity level (low, medium, high)
     */
    function verifyEvent(bytes32 eventId, string memory severity) external onlyVerifier {
        ClimateEvent storage evt = events[eventId];
        require(evt.reporter != address(0), "Event not found");
        require(!evt.verified, "Event already verified");

        evt.verified = true;
        
        // Calculate payout amount based on event type and severity
        uint256 payoutAmount = payoutMatrix[evt.eventType][severity];
        if (payoutAmount == 0) {
            payoutAmount = MIN_PAYOUT; // Default minimum payout
        }
        
        evt.payoutAmount = payoutAmount;

        emit EventVerified(eventId, msg.sender);
    }

    /**
     * @dev Process payout for a verified event
     * @param eventId The verified event to process payout for
     */
    function processPayout(bytes32 eventId) external {
        ClimateEvent storage evt = events[eventId];
        require(evt.reporter != address(0), "Event not found");
        require(evt.verified, "Event not verified");
        require(!evt.payoutProcessed, "Payout already processed");
        require(evt.payoutAmount > 0, "No payout amount set");

        // Check if contract has sufficient funds
        require(address(this).balance >= evt.payoutAmount, "Insufficient contract funds");

        evt.payoutProcessed = true;
        userBalances[evt.reporter] += evt.payoutAmount;

        emit PayoutProcessed(eventId, evt.reporter, evt.payoutAmount);
    }

    /**
     * @dev Create or update an insurance policy
     */
    function createPolicy() external payable {
        require(msg.value >= PREMIUM_RATE, "Insufficient premium payment");
        
        uint256 coverage = msg.value * 10; // 10x coverage ratio
        
        policies[msg.sender] = InsurancePolicy({
            premium: msg.value,
            coverage: coverage,
            startDate: block.timestamp,
            endDate: block.timestamp + 365 days,
            active: true,
            claimsCount: 0
        });

        totalPoolFunds += msg.value;

        emit PolicyCreated(msg.sender, msg.value, coverage);
    }

    /**
     * @dev Withdraw available balance
     */
    function withdraw() external {
        uint256 balance = userBalances[msg.sender];
        require(balance > 0, "No balance to withdraw");

        userBalances[msg.sender] = 0;
        payable(msg.sender).transfer(balance);

        emit BalanceWithdrawn(msg.sender, balance);
    }

    /**
     * @dev Add or remove verifier (only owner)
     * @param verifier Address to modify
     * @param status True to add, false to remove
     */
    function setVerifier(address verifier, bool status) external onlyOwner {
        verifiers[verifier] = status;
    }

    /**
     * @dev Add funds to the contract (for testing)
     */
    function addFunds() external payable {
        totalPoolFunds += msg.value;
    }

    /**
     * @dev Get event details
     * @param eventId The event ID to query
     */
    function getEvent(bytes32 eventId) external view returns (
        address reporter,
        string memory eventType,
        uint256 timestamp,
        bool verified,
        bool payoutProcessed,
        uint256 payoutAmount,
        string memory metaData
    ) {
        ClimateEvent memory evt = events[eventId];
        return (
            evt.reporter,
            evt.eventType,
            evt.timestamp,
            evt.verified,
            evt.payoutProcessed,
            evt.payoutAmount,
            evt.metaData
        );
    }

    /**
     * @dev Get user's insurance policy
     * @param user The user address to query
     */
    function getPolicy(address user) external view returns (
        uint256 premium,
        uint256 coverage,
        uint256 startDate,
        uint256 endDate,
        bool active,
        uint256 claimsCount
    ) {
        InsurancePolicy memory policy = policies[user];
        return (
            policy.premium,
            policy.coverage,
            policy.startDate,
            policy.endDate,
            policy.active,
            policy.claimsCount
        );
    }

    /**
     * @dev Get contract statistics
     */
    function getContractStats() external view returns (
        uint256 contractBalance,
        uint256 totalPool,
        uint256 activeEvents,
        uint256 totalPayouts
    ) {
        // Note: This is a simplified version
        // In production, you'd track these stats more efficiently
        return (
            address(this).balance,
            totalPoolFunds,
            0, // Would need to track this
            0  // Would need to track this
        );
    }

    /**
     * @dev Emergency withdrawal (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @dev Check if user has active policy
     */
    function hasActivePolicy(address user) external view returns (bool) {
        InsurancePolicy memory policy = policies[user];
        return policy.active && block.timestamp <= policy.endDate;
    }

    /**
     * @dev Get payout amount for event type and severity
     */
    function getPayoutAmount(string memory eventType, string memory severity) external view returns (uint256) {
        return payoutMatrix[eventType][severity];
    }

    // Fallback function to receive Ether
    receive() external payable {
        totalPoolFunds += msg.value;
    }
}
