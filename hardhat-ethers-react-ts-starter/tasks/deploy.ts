import '@nomiclabs/hardhat-waffle';
import { task } from 'hardhat/config';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

task('deploy', 'Deploy Greeter contract').setAction(
  async (_, hre: HardhatRuntimeEnvironment): Promise<void> => {
    const Greeter = await hre.ethers.getContractFactory('Greeter');
    const greeter = await Greeter.deploy('Hello, Hardhat!', 500,'0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc', 10, 25);

    await greeter.deployed();

    console.log('Greeter deployed to:', greeter.address);
  }
);
