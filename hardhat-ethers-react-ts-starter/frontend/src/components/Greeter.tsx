import { useWeb3React } from '@web3-react/core';
import { BigNumber, Contract, ethers, Signer, utils } from 'ethers';
import Web3 from 'web3';

import {
  ChangeEvent,
  MouseEvent,
  ReactElement,
  useEffect,
  useState
} from 'react';
import styled from 'styled-components';
import GreeterArtifact from '../artifacts/contracts/DutchAuction.sol/DutchAuction.json';
import { Provider } from '../utils/provider';
import { SectionDivider } from './SectionDivider';




const StyledDeployContractButton = styled.button`
  width: 180px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
  place-self: center;
`;

const StyledGreetingDiv = styled.div`
  display: grid;
  grid-template-rows: 1fr 1fr 1fr;
  grid-template-columns: 135px 2.7fr 1fr;
  grid-gap: 10px;
  place-self: center;
  align-items: center;
`;

const StyledLabel = styled.label`
  font-weight: bold;
`;

const StyledInput = styled.input`
  padding: 0.4rem 0.6rem;
  line-height: 2fr;
`;

const StyledButton = styled.button`
  width: 150px;
  height: 2rem;
  border-radius: 1rem;
  border-color: blue;
  cursor: pointer;
`;

export function Greeter(): ReactElement {
  const context = useWeb3React<Provider>();
  const { library, active } = context;

  const [signer, setSigner] = useState<Signer>();
  const [greeterContract, setGreeterContract] = useState<Contract>();
  const [greeterContractAddr, setGreeterContractAddr] = useState<string>('');
  // const [greeting, setGreeting] = useState<string>('');
  const [reservePrice, setReservePrice] = useState<string>('');
  const [numBlocksAuctionOpen, setNumBlocksAuctionOpen] = useState<string>('');
  const [offerPriceDecrement, setOfferPriceDecrement] = useState<string>('');
  const [judgeAddress, setJudgeAddress] = useState<string>('');
  const [auctionWinner, setAuctionWinner] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [auctionStatus, setAuctionStatus] = useState<string>('');
  const [owner, setOwner] = useState<string>(''); 
  const [greetingInput, setGreetingInput] = useState<string>('');

  useEffect((): void => {
    if (!library) {
      setSigner(undefined);
      return;
    }

    setSigner(library.getSigner());
  }, [library]);

  // useEffect((): void => {
  //   if (!greeterContract) {
  //     return;
  //   }

  //   // async function getGreeting(greeterContract: Contract): Promise<void> {
  //   //   const _greeting = await greeterContract.greet();

  //   //   if (_greeting !== greeting) {
  //   //     setGreeting(_greeting);
  //   //   }
  //   // }

    

  // //   getGreeting(greeterContract);
  // }, [greeterContract]);

  function handleDeployContract(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    // only deploy the Greeter contract one time, when a signer is defined
    if (!signer) {
      window.alert("No Signer.");
      console.log("No Signer.");
      return;
    }

    async function deployGreeterContract(signer: Signer): Promise<void> {
      const Greeter = new ethers.ContractFactory(
        GreeterArtifact.abi,
        GreeterArtifact.bytecode,
        signer
      );

      try {

        const reservePrice: number = parseInt((document.getElementById("reservePrice") as HTMLInputElement).value);
        const numBlocksAuctionOpen: number = parseInt((document.getElementById("noOfBlocks") as HTMLInputElement).value);
        const offerPriceDecrement: number = parseInt((document.getElementById("priceDecrement") as HTMLInputElement).value);
        const judgeAddress = (document.getElementById("judgeAddress") as HTMLInputElement).value;

        //0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
        const greeterContract = await Greeter.deploy(utils.parseEther(reservePrice.toString()),judgeAddress, numBlocksAuctionOpen, utils.parseEther(offerPriceDecrement.toString()));

        await greeterContract.deployed();

        // const greeting = await greeterContract.greet();
        // const reservePriceGet = await greeterContract.getReservePrice();
        // const numBlocksAuctionOpen = await greeterContract.getNumBlocksAuctionOpen();
        // const offerPriceDecrement = await greeterContract.getOfferPriceDecrement();
        // const currentPrice = await greeterContract.getCurrentPrice();
        const creationBlock = await greeterContract.getCreationBlock();
        const blockNumber = await greeterContract.getBlockNumber();
        const initPrice = await greeterContract.getInitPrice();
        const auctionWinner = await greeterContract.getAuctionWinner();
        const auctionStatus = await greeterContract.getAuctionStatus();
        const owner = await greeterContract.getOwner();
        const currentPrice  = (initPrice - offerPriceDecrement*(blockNumber-creationBlock))/1000000000000000000;
        // const judgeAddress = await greeterContract.getJudgeAddress();
        setGreeterContract(greeterContract);
        // setGreeting(greeting);
        setReservePrice(reservePrice.toString());
        setNumBlocksAuctionOpen(numBlocksAuctionOpen.toString());
        setOfferPriceDecrement(offerPriceDecrement.toString());
        setJudgeAddress(judgeAddress);
        setCurrentPrice(parseInt(currentPrice.toString(),10).toString());
        setAuctionWinner(auctionWinner);
        setAuctionStatus(auctionStatus);
        setOwner(owner);
        window.alert(`Contract deployed to: ${greeterContract.address}`);

        setGreeterContractAddr(greeterContract.address);
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }
    }

    deployGreeterContract(signer);
  }


  function handleGreetingChange(event: ChangeEvent<HTMLInputElement>): void {
    event.preventDefault();
    setGreetingInput(event.target.value);
  }

  async function handleGreetingFinalize(event: MouseEvent<HTMLButtonElement>): Promise<void>  {
    event.preventDefault();
    if (!signer) {
      window.alert("No Signer.");
      return;
    }

    if (!greeterContract) {
      window.alert('Undefined greeterContract');
      return;
    }


    if (judgeAddress!=await signer.getAddress() && auctionWinner != await signer.getAddress()) {
      window.alert("Only judge or winner can finalize");
    }
    async function finalizeGreeting(signer: Signer, greeterContract: Contract): Promise<void> {
      try {

        const finalizeResult = await greeterContract.connect(signer).finalize();
        await finalizeResult.wait();
        console.log(finalizeResult);

      }catch (error: any) {
        window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
      }

      setAuctionStatus(await greeterContract.getAuctionStatus());
  return;
  }
  finalizeGreeting(signer, greeterContract);
}

  async function handleGreetingSubmit(event: MouseEvent<HTMLButtonElement>): Promise<void>  {
    event.preventDefault();

    if (!signer) {
      window.alert("No Signer.");
      return;
    }

    if (owner==await signer.getAddress()) {
      window.alert("Owner cant bid.");
      return;
    }

    if (judgeAddress==await signer.getAddress()) {
      window.alert("Judge cant bid.");
      return;
    }

    if (!greeterContract) {
      window.alert('Undefined Dutch Auction Contract');
      return;
    }

    async function submitGreeting(signer: Signer, greeterContract: Contract): Promise<void> {
      try {
        console.log(parseFloat(greetingInput));

        try {
          const bid = await greeterContract.connect(signer).bid({value: utils.parseEther(greetingInput)});
          await bid.wait();
          console.log(bid);
          // return;
        } catch (error: any) {
          window.alert("Error!" + (error && error.message ? `\n\n${error.message}` : ''));
        }
        console.log("getting auction winner");
        setAuctionWinner(await greeterContract.getAuctionWinner());
        console.log("got auction winner");
      } catch (error: any) {
        window.alert(
          'Error!' + (error && error.message ? `\n\n${error.message}` : '')
        );
      }

      // try{
      //   // const greeting = await greeterContract.greet();
      //   const reservePrice = await greeterContract.getReservePrice();
      //   const numBlocksAuctionOpen = await greeterContract.getNumBlocksAuctionOpen();
      //   const offerPriceDecrement = await greeterContract.getOfferPriceDecrement();
      //   const currentPrice = await greeterContract.getCurrentPrice();
      //   const auctionWinner = await greeterContract.getAuctionWinner();
      //   const judgeAddress = await greeterContract.getJudgeAddress();
      //   setGreeterContract(greeterContract);
      //   // setGreeting(greeting);
      //   setReservePrice(reservePrice);
      //   setNumBlocksAuctionOpen(numBlocksAuctionOpen);
      //   setOfferPriceDecrement(offerPriceDecrement);
      //   setJudgeAddress(judgeAddress);
      //   setCurrentPrice(currentPrice);
      //   setAuctionWinner(auctionWinner);
      //   window.alert(`UI Updated: ${greeterContract.address}`);

      // }catch (error: any) {
      //   window.alert(
      //     'Error!' + (error && error.message ? `\n\n${error.message}` : '')
      //   );
      // }
    }

    submitGreeting(signer, greeterContract);
  }

  return (
    <>
    <StyledGreetingDiv>
    <StyledLabel>Judge Address </StyledLabel>
    <StyledInput id="judgeAddress"
          type="text"></StyledInput>
          <div></div>
          <StyledLabel> Reserve Price</StyledLabel>

    <StyledInput id="reservePrice"
          type="text"></StyledInput>
          <div></div>
          <StyledLabel>No. of blocks </StyledLabel>
    <StyledInput id="noOfBlocks"
          type="text"></StyledInput>
<div></div>
<StyledLabel>Price decrement </StyledLabel>
    <StyledInput id="priceDecrement"
          type="text"></StyledInput>
  <div></div>
      <StyledDeployContractButton
        disabled={!active || greeterContract ? true : false}
        style={{
          cursor: !active || greeterContract ? 'not-allowed' : 'pointer',
          borderColor: !active || greeterContract ? 'unset' : 'blue'
        }}
        onClick={handleDeployContract}
      >
        Deploy Contract
      </StyledDeployContractButton>
      </StyledGreetingDiv>
      <SectionDivider />
      <StyledGreetingDiv>
        <StyledLabel>Contract addr</StyledLabel>
        <div>
          {greeterContractAddr ? (
            greeterContractAddr
          ) : (
            <em>{`<Contract not yet deployed>`}</em>
          )}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        {/* <StyledLabel>Current greeting</StyledLabel>
        <div>
          
          {greeting ? greeting : <em>{`<Contract not yet deployed>`}</em>}
        </div> */}
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        {/* <div></div> */}
        <StyledLabel>Judge Address </StyledLabel>
        <div>
        {judgeAddress.toString() ? judgeAddress.toString() : <em>{`<Contract not yet deployed>`}</em>}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel>Current reserve price</StyledLabel>
        <div>
        {reservePrice.toString() ? reservePrice.toString() : <em>{`<Contract not yet deployed>`}</em>}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel>Current blocks open</StyledLabel>
        <div>
        {numBlocksAuctionOpen.toString() ? numBlocksAuctionOpen.toString() : <em>{`<Contract not yet deployed>`}</em>}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel>Price decrement</StyledLabel>
        <div>
        {offerPriceDecrement.toString() ? offerPriceDecrement.toString() : <em>{`<Contract not yet deployed>`}</em>}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel>Current price </StyledLabel>
        <div>
        {currentPrice.toString() ? currentPrice.toString() : <em>{`<Contract not yet deployed>`}</em>}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel>Winner</StyledLabel>
        <div>
        {auctionWinner.toString() ? auctionWinner.toString() : <em>{`<Contract not yet deployed>`}</em>}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel>Auction Status</StyledLabel>
        <div>
        {auctionStatus.toString() ? auctionStatus.toString() : <em>{`<Contract not yet deployed>`}</em>}
        </div>
        {/* empty placeholder div below to provide empty first row, 3rd col div for a 2x3 grid */}
        <div></div>
        <StyledLabel htmlFor="greetingInput">Set new bid</StyledLabel>
        <StyledInput
          id="greetingInput"
          type="text"
          // placeholder={greeting ? '' : '<Contract not yet deployed>'}
          onChange={handleGreetingChange}
          // style={{ fontStyle: greeting ? 'normal' : 'italic' }}
        ></StyledInput>
        <StyledButton
          disabled={!active || !greeterContract ? true : false}
          style={{
            cursor: !active || !greeterContract ? 'not-allowed' : 'pointer',
            borderColor: !active || !greeterContract ? 'unset' : 'blue'
          }}
          onClick={handleGreetingSubmit}
        >
          Submit
        </StyledButton>

        <StyledButton
          disabled={!active || !greeterContract ? true : false}
          style={{
            cursor: !active || !greeterContract ? 'not-allowed' : 'pointer',
            borderColor: !active || !greeterContract ? 'unset' : 'blue'
          }}
          onClick={handleGreetingFinalize}
        >
          Finalize
        </StyledButton>
      </StyledGreetingDiv>
    </>
  );
}
