pragma solidity 0.7.0;

/// @title Document verification.

contract Document {

    uint numSignatures;
    uint numSignatories;
    uint numOpposed;
    string documentHash;
    uint requiredSignatures;

    struct Signatory {
        bool sign;
        bool approve;
        //address delegate;
        bool rightToSign;
    }

    enum Status {Deploy, Setup, Approval, Finish}

    Status currentStatus = Status.Deploy;

    address public holder;

    mapping(address => Signatory) public signatories;

    constructor(uint signatures, string memory docHash) public {
        holder = msg.sender;
        //signatories[holder].rightToSign = true;

        requiredSignatures = signatures;

        numSignatories = 0;

        numSignatures = 0;

        documentHash = docHash;
    }

    function getStatus() public view returns (Status) {
        return currentStatus;
    }

    function getDocumentHash() public view returns (string memory) {
        return documentHash;
    }

    function getUrl() public view returns (string memory) {
        return documentHash;
    }

    function startSetup() public returns (bool) {
        require(msg.sender == holder, "Only holder can give right to sign.");
        if(currentStatus == Status.Deploy) {
            currentStatus = Status.Setup;
            return true;
        }
        return false;
    }

    function startApproval() public returns (bool) {
        require(msg.sender == holder, "Only holder can give right to sign.");
        if(currentStatus == Status.Setup) {
            currentStatus = Status.Approval;
            return true;
        }
        return false;
    }

    function endApproval() public returns (bool) {
        require(msg.sender == holder, "Only holder can give right to sign.");
        if(currentStatus == Status.Approval) {
            currentStatus = Status.Finish;
            return true;
        }
        return false;
    }

    function giveRightToSign(address signatory) public {
        require(msg.sender == holder, "Only holder can give right to sign.");
        require(!signatories[signatory].sign,"The signatory already sign.");
        signatories[signatory].rightToSign = true;
        numSignatories += 1;
    }

    function getSign() public view returns (bool sign) {
        sign = signatories[msg.sender].sign;
    }

    /*function delegate(address to) public {
        Signatory storage signatory = signatories[msg.sender];
        require(!signatory.sign, "Already sign");
        require(to != msg.sender, "Self-delegation is disallowed");
    }*/

    function sign() public {
        Signatory storage signatory = signatories[msg.sender];
        require(currentStatus == Status.Approval, "The approval is not started yet.");
        require(!signatory.sign, "Already sign.");
        require(signatory.rightToSign, "No rigt to sign.");
        signatory.sign = true;

        signatory.approve = true;
        numSignatures += 1;
    }

    function refuse() public {
    Signatory storage signatory = signatories[msg.sender];
    require(currentStatus == Status.Approval, "The approval is not started yet.");
    require(!signatory.sign, "Already sign.");
    require(signatory.rightToSign, "No rigt to sign.");
    signatory.sign = true;

    signatory.approve = false;
    numOpposed += 1;
    }

    function getNumOfAbstained() public view returns (uint) {
        return (numSignatories - numSignatures - numOpposed);
    }

    function getNumOfOpposed() public view returns (uint) {
        return (numOpposed);
    }

    function getNumOfSignatures() public view returns (uint) {
        return (numSignatures);
    }

    function isDocumentApproved() public view returns (bool approved) {
        require(currentStatus == Status.Finish, "The approval is not finished yet.");
        approved = (numSignatures >= requiredSignatures);
    }

    function isApprovedByAbsoluteMajority() public view returns (bool approved) {
        require(currentStatus == Status.Finish, "The approval is not finished yet.");
        approved = (numSignatures >= (numSignatories/2) + 1);
    }

    function isApprovedByRelativeMajority() public view returns (bool approved) {
        require(currentStatus == Status.Finish, "The approval is not finished yet.");
        approved = (numSignatures > numOpposed);
    }

}