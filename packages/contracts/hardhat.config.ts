/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { HardhatUserConfig } from 'hardhat/config';
import dotenv from 'dotenv';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import 'solidity-coverage';
import '@typechain/hardhat';
import 'hardhat-abi-exporter';
import 'hardhat-gas-reporter';
import './tasks';

dotenv.config();

interface MyHardhatConfig extends HardhatUserConfig {
  etherscan: {
    apiKey: string;
  };
  abiExporter: {
    path: string;
    clear: boolean;
    runOnCompile: boolean;
    pretty?: boolean;
  }[];
  typechain: {
    outDir: string;
  };
  gasReporter: {
    enabled: boolean;
    currency: string;
    gasPrice: number;
    src: string;
    coinmarketcap: string;
  };
}

const config: MyHardhatConfig = {
  solidity: {
    version: '0.8.17',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10_000,
      },
    },
  },
  networks: {
    mainnet: {
      url: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: process.env.MNEMONIC
        ? { mnemonic: process.env.MNEMONIC }
        : [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
      accounts: process.env.MNEMONIC
        ? { mnemonic: process.env.MNEMONIC }
        : [process.env.WALLET_PRIVATE_KEY!].filter(Boolean),
    },
    hardhat: {
      initialBaseFeePerGas: 0,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
  abiExporter: [
    {
      path: './abi',
      clear: true,
      runOnCompile: true,
    },
    {
      path: './abi/readable',
      clear: true,
      pretty: true,
      runOnCompile: true,
    },
  ],
  typechain: {
    outDir: './typechain',
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS?.toLowerCase() === 'true' ? true : false,
    currency: 'USD',
    gasPrice: 50,
    src: 'contracts',
    coinmarketcap: '7643dfc7-a58f-46af-8314-2db32bdd18ba',
  },
  mocha: {
    timeout: 60_000,
    parallel: true,
  },
};
export default config;
