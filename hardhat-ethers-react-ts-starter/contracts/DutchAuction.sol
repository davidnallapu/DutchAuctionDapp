//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract DutchAuction {
    uint256 private reservePrice;
    address private judgeAddress;
    uint256 private numBlocksAuctionOpen;
    uint256 private offerPriceDecrement;
    uint256 private finalWinnerBid;
    uint private startsAt;
    address private owner;
    uint private creationBlock;
    uint256 private initialPrice;
    uint256 private currentPrice;
    address private winner;
    bool private auctionOnline;
    bool private isFinalizedByJudge;
    bool private isFinalizedByWinner;
    bool private isRefundedByJudge;

    constructor( uint256 _reservePrice, address _judgeAddress, uint256 _numBlocksAuctionOpen, uint256 _offerPriceDecrement) {
        reservePrice = _reservePrice;
        console.log("Deploying a DutchAuction with reserve price:", _reservePrice);
        judgeAddress= _judgeAddress;
        offerPriceDecrement= _offerPriceDecrement;
        numBlocksAuctionOpen= _numBlocksAuctionOpen;
        owner = msg.sender;
        initialPrice = _reservePrice + _numBlocksAuctionOpen * _offerPriceDecrement;
        currentPrice=initialPrice;
        creationBlock = block.number;
        auctionOnline=true;
        isFinalizedByJudge=false;
        isFinalizedByWinner=false;
        isRefundedByJudge=false;
        startsAt=block.timestamp;
    }


    function getReservePrice() public view returns (uint256) {
        return reservePrice;
    }

    function getNumBlocksAuctionOpen() public view returns (uint256) {
        return numBlocksAuctionOpen;
    }

    function getOfferPriceDecrement() public view returns (uint256) {
        return offerPriceDecrement;
    }

    function getAuctionWinner() public view returns (address) {
        return winner;
    }

    function getCreationBlock() public view returns (uint256) {
        return creationBlock;
    }
    function getBlockNumber() public view returns (uint256) {
        return block.number;
    }
    function getInitPrice() public view returns (uint256) {
        return initialPrice;
    }

    function getJudgeAddress() public view returns (address) {
        return judgeAddress;
    }

    function getCurrentPrice() public view returns (uint256) {
        return currentPrice;
    }

    function getAuctionStatus() public view returns (string memory) {
        if(auctionOnline==true){
            return "Online";
        }
        return "Offline";
    }

    function getOwner() public view returns (address) {
       return owner;
    }

    function bid() public payable returns(address) {
        console.log("initPrice: ", currentPrice);
        console.log("block.timestamp", block.timestamp);
        console.log("startsAt", startsAt);
        currentPrice = initialPrice - offerPriceDecrement * (block.number - creationBlock);
        console.log("decrement: ", offerPriceDecrement * (block.timestamp - startsAt));
        console.log("currPrice: ", currentPrice);
        console.log("bidAmount", msg.value);
        require(
            auctionOnline == true,"auction offline"
        );

        //Refund total money if bid value is too low
        if(msg.value<=currentPrice){
            refund(msg.value);
        }
        require(
            msg.value>=currentPrice,"ETH< price"
        );

        require(
            block.number-creationBlock<numBlocksAuctionOpen,"check invalid block number"
        );
        console.log("before ", address(this).balance);
        // payable(owner).transfer(msg.value);
        // eth.sendTransaction({from:msg.sender, to:address(this), value: web3.toWei(100, "ether")});
        // payable(address(this)).send(currentPrice);
        
        uint refundAmount = msg.value - currentPrice;
        winner = msg.sender;
        finalWinnerBid = currentPrice;
        // auctionOnline = false;
        console.log("bid value",msg.value);
        console.log("before refund contract balance",address(this).balance);
        console.log("refundAmount",refundAmount);
 
        // payable(address(this)).send(msg.value);
        refund(refundAmount);
        console.log("after refund contract balance",address(this).balance);
        console.log("currentPrice: ", currentPrice);
        console.log("bid amount: ",msg.value);
        console.log("Owner: ", msg.sender==owner);
        console.log("Judge: ", msg.sender==judgeAddress);
        console.log("Winner: ", msg.sender==winner);
        console.log("after ",address(this).balance);
        return winner;
    }

    function finalize() public payable{

        //Checks if judge has finalized the bid
        require(
            isFinalizedByJudge!=true,"Already finalized by judge"
        );
        //Checks if judge has refunded the bid
        require(
            isRefundedByJudge!=true,"Already refunded by judge"
        );
        // Checks if auction is offline
        require(
            auctionOnline==true,"check auction offline"
        );
        //Checks if called by judge or winner
        require(
            msg.sender == judgeAddress || msg.sender == winner, "check finalize access"
        );

        if(msg.sender==winner){
            console.log("winner finalized");
            isFinalizedByWinner=true;
            auctionOnline=false;
            owner.call{value: finalWinnerBid}("");
        }
        if(msg.sender==judgeAddress){
        // require(
        //     isFinalizedByWinner==true,"Not finalized by winner"
        // );
        console.log("contract balance (finalize)", address(this).balance);
        console.log("msg.value(finalize)",msg.value);
        console.log(currentPrice);
        console.log(address(this).balance-currentPrice);
        require(
            address(this).balance >= currentPrice, "Error: Not enough ETH in contract."
        );
            console.log("judge finalized");
            console.log("judge balance", judgeAddress.balance);
            console.log("to be transferred from judge to owner", currentPrice);
            console.log("remaning judge balance", judgeAddress.balance-currentPrice);
            //Send money to owner
            console.log("hi0");
            auctionOnline=false;
            owner.call{value: finalWinnerBid}("");
            isFinalizedByJudge=true;
            isRefundedByJudge=true;
        }
    }

    function refund(uint256 refundAmount) public {

        if(msg.sender==judgeAddress){
            //Checks if winner has finalized the bid
            require(
                isFinalizedByWinner!=true,"Already finalized by winner"
            );
            //Checks if judge has finalized the bid
            require(
                isFinalizedByJudge!=true,"Already finalized by judge"
            );
            //Checks if judge has refunded the bid
            require(
                isRefundedByJudge!=true,"Already refunded by judge"
            );
    
            payable(winner).transfer(currentPrice);
            isFinalizedByJudge=true;
            isRefundedByJudge=true;
        }
        msg.sender.call{value: refundAmount}("");
    }

    //for testing framework
    function nop() public returns(bool) {
        return true;
    }
}
