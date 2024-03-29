import chai, { expect } from 'chai';
import { ethers } from 'hardhat';
import { constants, ContractReceipt, Event } from 'ethers';
import { solidity } from 'ethereum-waffle';
import { NounsSequiturToken } from '../typechain';
import { deployNounsSequiturToken } from './utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(solidity);

describe('NounsSequiturToken', () => {
  let nounsSequiturToken: NounsSequiturToken;
  let deployer: SignerWithAddress;
  let soundersDAO: SignerWithAddress;
  let snapshotId: number;

  before(async () => {
    [deployer, soundersDAO] = await ethers.getSigners();
    nounsSequiturToken = await deployNounsSequiturToken(
      deployer,
      soundersDAO.address,
      deployer.address,
    );
  });

  beforeEach(async () => {
    snapshotId = await ethers.provider.send('evm_snapshot', []);
  });

  afterEach(async () => {
    await ethers.provider.send('evm_revert', [snapshotId]);
  });

  it('should allow the minter to mint a Noun Sequitur to itself and a reward noun to the soundersDAO', async () => {
    const receipt = await (await nounsSequiturToken.mint()).wait();

    const [, , soundersNonSequiturCreated, , , ownersNonSequiturCreated] = receipt.events || [];

    expect(await nounsSequiturToken.ownerOf(0)).to.eq(soundersDAO.address);
    expect(soundersNonSequiturCreated?.event).to.eq('NounsSequiturCreated');
    expect(soundersNonSequiturCreated?.args?.tokenId).to.eq(0);

    expect(await nounsSequiturToken.ownerOf(1)).to.eq(deployer.address);
    expect(ownersNonSequiturCreated?.event).to.eq('NounsSequiturCreated');
    expect(ownersNonSequiturCreated?.args?.tokenId).to.eq(1);
  });

  it('should set symbol', async () => {
    expect(await nounsSequiturToken.symbol()).to.eq('NOUNSSEQUITUR');
  });

  it('should set name', async () => {
    expect(await nounsSequiturToken.name()).to.eq('Nouns Sequitur');
  });

  it('should allow minter to mint a noun to itself', async () => {
    await (await nounsSequiturToken.mint()).wait();

    const receipt = await (await nounsSequiturToken.mint()).wait();
    const NounsSequiturCreated = receipt.events?.[2];

    expect(await nounsSequiturToken.ownerOf(2)).to.eq(deployer.address);
    expect(NounsSequiturCreated?.event).to.eq('NounsSequiturCreated');
    expect(NounsSequiturCreated?.args?.tokenId).to.eq(2);
  });

  it('should emit two transfer logs on mint', async () => {
    const [, , creator, minter] = await ethers.getSigners();

    await (await nounsSequiturToken.mint()).wait();

    await (await nounsSequiturToken.setMinter(minter.address)).wait();
    await (await nounsSequiturToken.transferOwnership(creator.address)).wait();

    const tx = nounsSequiturToken.connect(minter).mint();

    await expect(tx)
      .to.emit(nounsSequiturToken, 'Transfer')
      .withArgs(constants.AddressZero, creator.address, 2);
    await expect(tx)
      .to.emit(nounsSequiturToken, 'Transfer')
      .withArgs(creator.address, minter.address, 2);
  });

  it('should allow minter to burn a noun sequitur', async () => {
    await (await nounsSequiturToken.mint()).wait();

    const tx = nounsSequiturToken.burn(0);
    await expect(tx).to.emit(nounsSequiturToken, 'NounsSequiturBurned').withArgs(0);
  });

  it('should revert on non-minter mint', async () => {
    const account0AsNounErc721Account = nounsSequiturToken.connect(soundersDAO);
    await expect(account0AsNounErc721Account.mint()).to.be.reverted;
  });

  it('should not allow more than 401 tokens to be minted', async () => {
    let receipt: ContractReceipt;
    let lastEvent: Event | undefined;
    while ((await nounsSequiturToken.totalSupply()).toNumber() < 401) {
      receipt = await (await nounsSequiturToken.mint()).wait();
      lastEvent = receipt?.events && receipt.events[receipt.events.length - 1];
    }

    await expect(nounsSequiturToken.mint()).to.be.revertedWith(
      'All Nouns Sequitur have been minted',
    );

    expect((await nounsSequiturToken.totalSupply()).toNumber()).to.eq(401);
    expect(lastEvent?.args?.tokenId).to.eq(400);
    expect(await nounsSequiturToken.balanceOf(soundersDAO.address)).to.eq(41);
    expect(await nounsSequiturToken.balanceOf(deployer.address)).to.eq(360);
  });

  describe('contractURI', async () => {
    it('should return correct contractURI', async () => {
      expect(await nounsSequiturToken.contractURI()).to.eq(
        'ipfs://QmZi1n79FqWt2tTLwCqiy6nLM6xLGRsEPQ5JmReJQKNNzX', // TODO: @enx
      );
    });
    it('should allow owner to set contractURI', async () => {
      await nounsSequiturToken.setContractURIHash('ABC123');
      expect(await nounsSequiturToken.contractURI()).to.eq('ipfs://ABC123');
    });
    it('should not allow non owner to set contractURI', async () => {
      const [, nonOwner] = await ethers.getSigners();
      await expect(
        nounsSequiturToken.connect(nonOwner).setContractURIHash('BAD'),
      ).to.be.revertedWith('Ownable: caller is not the owner');
    });
  });
});
