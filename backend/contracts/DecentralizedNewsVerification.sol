// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DecentralizedNewsVerification
 * @dev Smart contract for storing verified news content hashes and verification records on blockchain
 * Used in conjunction with IPFS for content storage and CUDOS blockchain for verification proofs
 */
contract DecentralizedNewsVerification {
    // Struct to store verification record
    struct VerificationRecord {
        bytes32 contentCID; // IPFS Content Identifier
        bytes32 contentHash; // SHA256 hash of content
        address verifier; // Address that performed verification
        uint256 verificationScore; // Verification score (0-10000, representing 0.00%-100.00%)
        uint256 timestamp; // Block timestamp of verification
        string integrityLevel; // "verified", "questionable", "debunked"
        bool isActive; // Whether this record is still valid
        bytes32 previousVersion; // Link to previous version if updated
    }

    // Struct for news source reputation
    struct SourceReputation {
        uint256 totalSubmissions;
        uint256 verifiedSubmissions;
        uint256 averageScore;
        uint256 lastActivity;
        bool isActive;
    }

    // State variables
    mapping(bytes32 => VerificationRecord) public verificationRecords;
    mapping(address => SourceReputation) public sourceReputations;
    mapping(bytes32 => bytes32[]) public contentVersions; // Content hash to all version CIDs

    address public owner;
    uint256 public totalVerifications;
    uint256 public minimumVerificationScore = 7000; // 70.00% minimum for "verified"

    // Events
    event NewsVerified(
        bytes32 indexed verificationId,
        bytes32 indexed contentCID,
        address indexed verifier,
        uint256 verificationScore,
        string integrityLevel
    );

    event SourceReputationUpdated(
        address indexed source,
        uint256 totalSubmissions,
        uint256 verifiedSubmissions,
        uint256 averageScore
    );

    event ContentUpdated(
        bytes32 indexed contentHash,
        bytes32 indexed newCID,
        bytes32 indexed oldCID
    );

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier validVerificationScore(uint256 _score) {
        require(_score <= 10000, "Verification score cannot exceed 100.00%");
        _;
    }

    // Constructor
    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Store a new verification record on the blockchain
     * @param _verificationId Unique identifier for this verification
     * @param _contentCID IPFS Content Identifier
     * @param _contentHash SHA256 hash of the content
     * @param _verificationScore Verification score (0-10000)
     * @param _integrityLevel Integrity level ("verified", "questionable", "debunked")
     */
    function storeVerification(
        bytes32 _verificationId,
        bytes32 _contentCID,
        bytes32 _contentHash,
        uint256 _verificationScore,
        string memory _integrityLevel
    ) external validVerificationScore(_verificationScore) {
        require(
            verificationRecords[_verificationId].timestamp == 0,
            "Verification ID already exists"
        );
        require(_contentCID != bytes32(0), "Content CID cannot be empty");
        require(_contentHash != bytes32(0), "Content hash cannot be empty");

        // Create verification record
        VerificationRecord memory newRecord = VerificationRecord({
            contentCID: _contentCID,
            contentHash: _contentHash,
            verifier: msg.sender,
            verificationScore: _verificationScore,
            timestamp: block.timestamp,
            integrityLevel: _integrityLevel,
            isActive: true,
            previousVersion: bytes32(0)
        });

        verificationRecords[_verificationId] = newRecord;
        totalVerifications++;

        // Add to content versions history
        contentVersions[_contentHash].push(_contentCID);

        // Update source reputation
        _updateSourceReputation(
            msg.sender,
            _verificationScore,
            _integrityLevel
        );

        emit NewsVerified(
            _verificationId,
            _contentCID,
            msg.sender,
            _verificationScore,
            _integrityLevel
        );
    }

    /**
     * @dev Update an existing verification record (for corrections or updates)
     * @param _verificationId Existing verification ID
     * @param _newCID New IPFS Content Identifier
     * @param _newScore Updated verification score
     * @param _newIntegrityLevel Updated integrity level
     */
    function updateVerification(
        bytes32 _verificationId,
        bytes32 _newCID,
        uint256 _newScore,
        string memory _newIntegrityLevel
    ) external validVerificationScore(_newScore) {
        VerificationRecord storage record = verificationRecords[
            _verificationId
        ];
        require(record.timestamp != 0, "Verification record does not exist");
        require(
            record.verifier == msg.sender || msg.sender == owner,
            "Only verifier or owner can update"
        );

        bytes32 oldCID = record.contentCID;
        bytes32 contentHash = record.contentHash;

        // Update record
        record.contentCID = _newCID;
        record.verificationScore = _newScore;
        record.integrityLevel = _newIntegrityLevel;
        record.previousVersion = oldCID;

        // Add new version to history
        contentVersions[contentHash].push(_newCID);

        // Update source reputation
        _updateSourceReputation(msg.sender, _newScore, _newIntegrityLevel);

        emit ContentUpdated(contentHash, _newCID, oldCID);
    }

    /**
     * @dev Get verification record by ID
     * @param _verificationId The verification ID to query
     * @return Verification record details
     */
    function getVerification(
        bytes32 _verificationId
    )
        external
        view
        returns (
            bytes32 contentCID,
            bytes32 contentHash,
            address verifier,
            uint256 verificationScore,
            uint256 timestamp,
            string memory integrityLevel,
            bool isActive,
            bytes32 previousVersion
        )
    {
        VerificationRecord memory record = verificationRecords[_verificationId];
        require(record.timestamp != 0, "Verification record does not exist");

        return (
            record.contentCID,
            record.contentHash,
            record.verifier,
            record.verificationScore,
            record.timestamp,
            record.integrityLevel,
            record.isActive,
            record.previousVersion
        );
    }

    /**
     * @dev Get all versions of content by content hash
     * @param _contentHash The content hash to query
     * @return Array of all CIDs for this content
     */
    function getContentVersions(
        bytes32 _contentHash
    ) external view returns (bytes32[] memory) {
        return contentVersions[_contentHash];
    }

    /**
     * @dev Get source reputation
     * @param _source Address of the source
     * @return Source reputation details
     */
    function getSourceReputation(
        address _source
    )
        external
        view
        returns (
            uint256 totalSubmissions,
            uint256 verifiedSubmissions,
            uint256 averageScore,
            uint256 lastActivity,
            bool isActive
        )
    {
        SourceReputation memory reputation = sourceReputations[_source];
        return (
            reputation.totalSubmissions,
            reputation.verifiedSubmissions,
            reputation.averageScore,
            reputation.lastActivity,
            reputation.isActive
        );
    }

    /**
     * @dev Check if content is verified based on minimum score
     * @param _verificationId The verification ID to check
     * @return True if content meets verification criteria
     */
    function isContentVerified(
        bytes32 _verificationId
    ) external view returns (bool) {
        VerificationRecord memory record = verificationRecords[_verificationId];
        return
            record.isActive &&
            record.verificationScore >= minimumVerificationScore &&
            keccak256(abi.encodePacked(record.integrityLevel)) ==
            keccak256(abi.encodePacked("verified"));
    }

    /**
     * @dev Deactivate a verification record (for retractions)
     * @param _verificationId The verification ID to deactivate
     */
    function deactivateVerification(bytes32 _verificationId) external {
        VerificationRecord storage record = verificationRecords[
            _verificationId
        ];
        require(record.timestamp != 0, "Verification record does not exist");
        require(
            record.verifier == msg.sender || msg.sender == owner,
            "Only verifier or owner can deactivate"
        );

        record.isActive = false;
    }

    /**
     * @dev Update minimum verification score (only owner)
     * @param _newMinimum New minimum verification score
     */
    function updateMinimumVerificationScore(
        uint256 _newMinimum
    ) external onlyOwner validVerificationScore(_newMinimum) {
        minimumVerificationScore = _newMinimum;
    }

    /**
     * @dev Transfer ownership
     * @param _newOwner New owner address
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        owner = _newOwner;
    }

    /**
     * @dev Internal function to update source reputation
     */
    function _updateSourceReputation(
        address _source,
        uint256 _score,
        string memory _integrityLevel
    ) internal {
        SourceReputation storage reputation = sourceReputations[_source];

        reputation.totalSubmissions++;
        reputation.lastActivity = block.timestamp;
        reputation.isActive = true;

        // Update verified count and average score
        bool isVerified = keccak256(abi.encodePacked(_integrityLevel)) ==
            keccak256(abi.encodePacked("verified"));
        if (isVerified) {
            reputation.verifiedSubmissions++;
        }

        // Calculate new average score
        if (reputation.totalSubmissions == 1) {
            reputation.averageScore = _score;
        } else {
            reputation.averageScore =
                (reputation.averageScore *
                    (reputation.totalSubmissions - 1) +
                    _score) /
                reputation.totalSubmissions;
        }

        emit SourceReputationUpdated(
            _source,
            reputation.totalSubmissions,
            reputation.verifiedSubmissions,
            reputation.averageScore
        );
    }

    /**
     * @dev Get contract statistics
     * @return Total verifications, minimum score, and owner
     */
    function getContractStats()
        external
        view
        returns (
            uint256 _totalVerifications,
            uint256 _minimumVerificationScore,
            address _owner
        )
    {
        return (totalVerifications, minimumVerificationScore, owner);
    }
}
