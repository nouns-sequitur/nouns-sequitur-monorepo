import { task } from 'hardhat/config';
import { ContractNames, DeployedContract } from './types';

async function delay(seconds: number) {
  return new Promise(resolve => setTimeout(resolve, 1000 * seconds));
}

// may need token URI
task('deploy-test-token', 'Deploy TokenHarness given a descriptor').setAction(
  async (args, { ethers, run, network }) => {
    const [deployer] = await ethers.getSigners();
    console.log(`Deploying from address ${deployer.address}`);

    const proxyRegistryAddress = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';

    const token = await (
      await ethers.getContractFactory('TokenHarness', deployer)
    ).deploy(deployer.address, deployer.address, proxyRegistryAddress);
    console.log(`TokenHarness deployed to: ${token.address}`);

    if (network.name !== 'localhost') {
      console.log('Waiting 1 minute before verifying contracts on Etherscan');
      await delay(60);

      console.log('Verifying contracts on Etherscan...');
      const contracts: Record<string, DeployedContract> = {} as Record<string, DeployedContract>;

      contracts.TokenHarness = {
        name: 'TokenHarness',
        address: token.address,
        constructorArguments: [deployer.address, deployer.address, proxyRegistryAddress],
        instance: token,
        libraries: {},
      };

      await run('verify-etherscan', {
        contracts,
      });
      console.log('Verify complete.');
    }

    console.log('Done');
  },
);
