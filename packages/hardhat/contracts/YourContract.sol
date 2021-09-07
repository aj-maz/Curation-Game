pragma solidity >=0.6.0 <0.9.0;
pragma experimental ABIEncoderV2;
//SPDX-License-Identifier: MIT

//import "@openzeppelin/contracts/access/Ownable.sol"; //https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract GTC is ERC20 {
    mapping(address => bool) public minted;

    constructor() public ERC20("GitCoin", "gtc") {
        _mint(msg.sender, 10000000000);
    }

    function getToken() public {
        require(
            !minted[msg.sender],
            "Dude you already got some token, don't be greedy!"
        );
        _mint(msg.sender, 100000000);
        minted[msg.sender] = true;
    }
}

contract POHmimic {
    mapping(address => bool) submissions;

    function isRegistered(address _submissionID) external view returns (bool) {
        return submissions[_submissionID] == true ? true : false;
    }

    function register(address _submissionId) public {
        submissions[_submissionId] = true;
    }
}

interface IPOH {
    function isRegistered(address _submissionID) external view returns (bool);
}

contract TriageGroup {
    constructor() public {}

    // We can do all the fancy thing - multi sig - DAO voting , ...
    // Here
    // The only required interface for Triage Group Contract is the reviewGrant Function
    // Currently for test purpose everybody can call this function

    // !Warning !! SOME SORT OF ACL MUST BE IMPLEMENTED HERE

    function reviewGrant(
        address _grant,
        string memory _curationHash,
        uint256 _content,
        uint256 _category,
        uint256 _legit
    ) public {
        Grant grant = Grant(_grant);
        grant.triageReview(_curationHash, _content, _category, _legit);
    }
}

contract Reputations {
    using SafeMath for uint256;

    // Only grants that are allowed by manager contract can change the reputation
    address manager;
    mapping(address => bool) public allowed;

    mapping(address => uint256) public reputations;
    address triageGroup;

    modifier onlyManager() {
        require(
            msg.sender == manager,
            "You're not the manager here, we don't trust you."
        );
        _;
    }

    modifier isAllowed() {
        require(
            allowed[msg.sender],
            "Do I look like a fool? You're not allowed here!"
        );
        _;
    }

    constructor(address _triageGroup, address _manager) public {
        // set owner
        triageGroup = _triageGroup;
        manager = _manager;
    }

    function calculateReputationPoints(
        uint256 currentReputationPoint,
        bool isAligned
    ) public pure returns (uint256) {
        // isAligned shows wether curator
        uint256 result;
        if (isAligned) {
            //
            result = currentReputationPoint.mul(4);
        } else {
            // Wrong answers will decrease the reputation point so exponentialy
            //if (currentReputationPoint <= 10) {
            //    return 1;
            //}
            //result = currentReputationPoint.div(5);
        }
        if (result < 1) {
            // Min of reputation points is 1
            return 1;
        }
        if (result > 1000) {
            // Max of reputation points is 1
            return 1000;
        }
        return result;
    }

    function sqrt(uint256 y) internal pure returns (uint256) {
        uint256 z;
        if (y > 3) {
            z = y;
            uint256 x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
        return z;
    }

    function allowGrant(address _grant) public onlyManager {
        allowed[_grant] = true;
    }

    function setReputations(address _curator, bool _isAligned)
        public
        isAllowed
    {
        // get an array of addresses and their consensus result and put in the mapping
        // Honestly these algorithms are unconsistent
        // We must work on it
        uint256 effectiveRP = reputations[_curator] + 1;
        uint256 newRP;

        if (_isAligned) {
            newRP = effectiveRP.mul(2);
        } else {
            // Wrong answers will decrease the reputation point so exponentialy
            if (effectiveRP <= 10) {
                newRP = 1;
            } else {
                newRP = effectiveRP.div(5);
            }
        }

        if (newRP < 1) {
            // Min of reputation points is 1
            newRP = 1;
        }
        if (newRP > 1000) {
            // Max of reputation points is 1
            newRP = 1000;
        }
        reputations[_curator] = newRP;
    }

    function getReputationPoint(address _curator)
        public
        view
        returns (uint256)
    {
        return uint256(reputations[_curator]) + 1;
    }

    function getCurationWeight(address _curator) public view returns (uint256) {
        // The weight of curator vote is it's sqrt(reputationPoint) + 1
        if (_curator == triageGroup) {
            return 100;
        }
        return sqrt(uint256(reputations[_curator])) + 1;
    }
}

contract Grant {
    using Math for uint256;
    using SafeMath for uint256;

    enum Statuses {
        INITIATED,
        TO_BE_JUDGED,
        FINALIZED,
        NEED_EDIT,
        NEED_TRIAGE
    }

    enum Results {
        PASS,
        FAIL,
        TRIAGE,
        MODS
    }

    struct Curation {
        address curator;
        string curationHash;
        Results content;
        Results category;
        Results legit;
    }

    // Status
    Reputations reputation;
    ERC20 gtc;
    IPOH poh;
    TriageGroup triageGroup;
    string public grantHash;
    address public owner;
    uint256 public bountyAmount;
    uint256 public version = 0;
    mapping(uint256 => Curation[]) public curations;
    mapping(uint256 => mapping(address => bool)) public versionVoters;

    mapping(address => uint256) public curatorsShare;
    uint256 public totalShares;
    mapping(address => bool) public isPayedOut;

    Statuses public status;
    uint256 public confidence;
    Results public result;

    constructor(
        address _owner,
        string memory _grantHash,
        uint256 _bountyAmount,
        Reputations _reputation,
        ERC20 _gtc,
        IPOH _poh,
        TriageGroup _triageGroup
    ) public {
        gtc = _gtc;
        reputation = _reputation;
        grantHash = _grantHash;
        status = Statuses.INITIATED;
        owner = _owner;
        bountyAmount = _bountyAmount;
        version = 0;
        poh = _poh;
        triageGroup = _triageGroup;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    modifier finalizable() {
        // TODO need to find a proper condition for when the grant curation is finishable        // We need to specify who and when can finalize this
        // We need to specify who and when can finalize this

        require(
            curations[version].length >= 3,
            "For finalizing a grant curation atleast 3 vote is required"
        );
        _;
    }

    modifier editable() {
        // TODO need to find a proper condition for when the grant curation is finishable
        require(
            status == Statuses.NEED_EDIT,
            "This grant is not editable, atleast yet!"
        );
        _;
    }

    modifier toBeJudged() {
        // TODO need to find a proper condition for when the grant curation is finishable
        require(
            status == Statuses.TO_BE_JUDGED,
            "This grant is not to be judged, atleast for now!"
        );
        _;
    }

    modifier triagable() {
        require(
            status == Statuses.NEED_TRIAGE,
            "This grant is not triagble, atleast yet!"
        );
        _;
    }

    modifier finalized() {
        require(
            status == Statuses.FINALIZED,
            "Be patient! Grant is not finalized yet"
        );
        _;
    }

    function makeJudgeable() public onlyOwner {
        // Grant owner will send money to this contract manually
        // Grant owner need to put a bounty for curators
        require(gtc.balanceOf(address(this)) >= bountyAmount);
        status = Statuses.TO_BE_JUDGED;
    }

    function takeBounty() public finalized {
        // Curators must be able to get their bounties after
        require(
            !isPayedOut[msg.sender],
            "Chill bro, you already got paid. Do you think we print money here?"
        );
        // People who does not curated but want to take bounty will be able to
        // do this transaction but they would get nothing
        uint256 userShare = (curatorsShare[msg.sender]).mul(bountyAmount).div(
            totalShares
        );
        gtc.transfer(msg.sender, userShare);
        isPayedOut[msg.sender] = true;
    }

    function addPeerReview(
        string memory _curationHash,
        uint256 _content,
        uint256 _category,
        uint256 _legit
    ) public toBeJudged {
        // Curators must be able to add peer review to grants
        //curations
        require(poh.isRegistered(msg.sender), "Not a human, atleast yet!");
        require(!versionVoters[version][msg.sender], "You already voted!");
        Curation[] storage currentVersionCuration = curations[version];
        currentVersionCuration.push(
            Curation(
                msg.sender,
                _curationHash,
                Results(_content),
                Results(_category),
                Results(_legit)
            )
        );
        versionVoters[version][msg.sender] = true;
    }

    function triageReview(
        string memory _curationHash,
        uint256 _content,
        uint256 _category,
        uint256 _legit
    ) public triagable {
        // Only the triageGroup can do this transaction
        require(
            msg.sender == address(triageGroup),
            "Only the triage group can do this transaction."
        );
        require(
            _content != 2 && _category != 2 && _legit != 2,
            "You are the triage group, you can not send to triage again, wtf!"
        );
        Curation[] storage currentVersionCuration = curations[version];
        currentVersionCuration.push(
            Curation(
                msg.sender,
                _curationHash,
                Results(_content),
                Results(_category),
                Results(_legit)
            )
        );
        finalizeResult();
    }

    function edit(string memory _newHash) public editable {
        // Grant owner must be able to edit mod grant
        version++;
        status = Statuses.TO_BE_JUDGED;
        delete result;
        delete confidence;
        grantHash = _newHash;
    }

    function compileSingle(Curation memory curation)
        public
        pure
        returns (Results)
    {
        // Everybody should be able to compile the grant result
        // Pass | Fail | Mods | Pend
        if (
            curation.content == Results.FAIL ||
            curation.category == Results.FAIL ||
            curation.legit == Results.FAIL
        ) {
            return Results.FAIL;
        }
        if (
            curation.content == Results.TRIAGE ||
            curation.category == Results.TRIAGE ||
            curation.legit == Results.TRIAGE
        ) {
            return Results.TRIAGE;
        }
        if (
            curation.content == Results.MODS ||
            curation.category == Results.MODS ||
            curation.legit == Results.MODS
        ) {
            return Results.MODS;
        }
        return Results.PASS;
    }

    function finalizeShares(Results _finalResult) private {
        uint256 totalReputationPoints = 0;
        Curation[] storage currentVersionCuration;
        uint256 curatorPoint;
        Curation storage cur;
        uint256 j;
        uint256 i;
        for (i = 0; i <= version; i++) {
            currentVersionCuration = curations[i];
            for (j = 0; j < currentVersionCuration.length; j++) {
                cur = (currentVersionCuration[j]);
                if (compileSingle(cur) == _finalResult) {
                    curatorPoint = reputation.getReputationPoint(
                        currentVersionCuration[j].curator
                    );
                    curatorsShare[cur.curator] += curatorPoint;
                    totalReputationPoints += curatorPoint;
                }
            }
        }
        totalShares = totalReputationPoints;
    }

    function currentVotesCounts() public view returns (uint256) {
        Curation[] storage currentVersionCuration = curations[version];
        return currentVersionCuration.length;
    }

    function finalizeResult() public finalizable {
        Curation[] storage currentVersionCuration = curations[version];
        uint256 passCountWeight = 0;
        uint256 failedCountWeight = 0;
        uint256 triageCountWeight = 0;
        uint256 modsCountWeight = 0;
        uint256 totalWeight = 0;
        uint256 curateWeight = 0;

        for (uint256 i; i < currentVersionCuration.length; i++) {
            curateWeight = reputation.getCurationWeight(
                currentVersionCuration[i].curator
            );
            totalWeight = totalWeight + curateWeight;
            if (compileSingle(currentVersionCuration[i]) == Results.FAIL) {
                failedCountWeight += curateWeight;
            }
            if (compileSingle(currentVersionCuration[i]) == Results.PASS) {
                passCountWeight += curateWeight;
            }
            if (compileSingle(currentVersionCuration[i]) == Results.TRIAGE) {
                triageCountWeight += curateWeight;
            }
            if (compileSingle(currentVersionCuration[i]) == Results.MODS) {
                modsCountWeight += curateWeight;
            }
        }

        uint256 finalCountWeight = 0;
        Results finalResult;

        if (triageCountWeight >= failedCountWeight) {
            finalCountWeight = triageCountWeight;
            finalResult = Results.TRIAGE;
        } else {
            finalCountWeight = failedCountWeight;
            finalResult = Results.FAIL;
        }
        if (modsCountWeight > finalCountWeight) {
            finalResult = Results.MODS;
            finalCountWeight = modsCountWeight;
        }
        if (passCountWeight > finalCountWeight) {
            finalResult = Results.PASS;
            finalCountWeight = passCountWeight;
        }

        confidence = finalCountWeight.mul(100).div(totalWeight);
        result = finalResult;
        if (finalResult == Results.FAIL || finalResult == Results.PASS) {
            status = Statuses.FINALIZED;
            finalizeShares(finalResult);
        } else if (finalResult == Results.TRIAGE) {
            status = Statuses.NEED_TRIAGE;
        } else {
            status = Statuses.NEED_EDIT;
        }

        // Handling reputation gains here
        for (uint256 i; i < currentVersionCuration.length; i++) {
            if (compileSingle(currentVersionCuration[i]) == finalResult) {
                reputation.setReputations(
                    currentVersionCuration[i].curator,
                    true
                );
            } else {
                reputation.setReputations(
                    currentVersionCuration[i].curator,
                    false
                );
            }
        }
    }
}

contract GrantManager {
    Reputations public reputation;
    ERC20 gtc;
    Grant[] public grants;
    IPOH poh;
    TriageGroup triageGroup;

    event GrantCreated(string _grantHash, uint256 grantId);

    constructor(
        address _gtcAddress,
        address _pohAddress,
        address _triageGroup
    ) public {
        // Setup Reputation System
        // Setup GTC-ERC20
        reputation = new Reputations(_triageGroup, address(this));
        gtc = ERC20(_gtcAddress);
        poh = IPOH(_pohAddress);
        triageGroup = TriageGroup(_triageGroup);
    }

    function calculateStakeAndBounty() public view returns (uint256) {
        // TODO this function is just for demonstrating the concept ot variable bounty
        // TODO the algorithm must be changed.
        uint256 unfinishedGrants = 0;
        for (uint256 i; i < grants.length; i++) {
            if (uint256(grants[i].status()) < 2) {
                unfinishedGrants += uint256(grants[i].status());
            }
        }
        return 10**4 + unfinishedGrants * 400;
    }

    function createGrant(string memory _grantHash) public {
        Grant grant = new Grant(
            msg.sender,
            _grantHash,
            calculateStakeAndBounty(),
            reputation,
            gtc,
            poh,
            triageGroup
        );
        grants.push(grant);
        reputation.allowGrant(address(grant));
        emit GrantCreated(_grantHash, grants.length - 1);
    }

    function grantsAmount() public view returns (uint) {
        return grants.length;
    }
}
