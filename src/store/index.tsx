import { ethers, utils } from "ethers";
import { Currency, Transaction } from "../types";
import { Container } from "unstated";

// This is a simplified ABI that only has the functions
// that the app might care about.
import ERC20Abi from "../utils/ERC20.json";

export enum Route {
  Main,
  Send,
  Receive,
  Save,
  Advanced,
  Transactions
}

export interface RootState {
  currency: Currency;
  route: Route;
  xDaiProvider: ethers.providers.Provider;
  ethProvider: ethers.providers.Provider;
  xDaiWallet: ethers.Wallet;
  ethWallet: ethers.Wallet;
  xDaiBalance?: ethers.utils.BigNumber;
  daiBalance?: ethers.utils.BigNumber;
  ethBalance?: ethers.utils.BigNumber;
  transactions: Transaction[];
  daiContract: ethers.Contract;
}

const DAI = "0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359";

export class AppContainer extends Container<RootState> {
  constructor() {
    super();
    let privateKey = localStorage.getItem("efectivoPrivateKey");

    if (privateKey === null) {
      privateKey = ethers.Wallet.createRandom().privateKey;
      localStorage.setItem("efectivoPrivateKey", privateKey);
    }
    const xDaiProvider = new ethers.providers.JsonRpcProvider(
      "http://localhost:3000"
    );
    const ethProvider = ethers.getDefaultProvider();
    const xDaiWallet = new ethers.Wallet(privateKey, xDaiProvider);
    const ethWallet = new ethers.Wallet(privateKey, ethProvider);

    xDaiProvider.on(xDaiWallet.address, this.setXDaiBalance);
    ethProvider.on(ethWallet.address, this.setEthBalance);

    this.state = {
      currency: Currency.XDAI,
      route: Route.Main,
      xDaiProvider,
      ethProvider,
      xDaiWallet,
      ethWallet,
      transactions: [],
      daiContract: new ethers.Contract(DAI, ERC20Abi, ethProvider)
    };
  }

  fetchTxns = () => {
    let url: String = `https://blockscout.com/poa/dai/api?module=account&action=txlist&address=`;
    return fetch(url + this.state.xDaiWallet.address)
      .then(res => res.json())
      .then(response => {
        return response;
      });
  };

  sendTx = (
    currency: Currency,
    toAddress: string,
    amount: ethers.utils.BigNumber
  ) => {
    let wallet: ethers.Wallet;
    switch (currency) {
      case Currency.DAI:
      case Currency.ETH:
        wallet = this.state.ethWallet;
        break;
      default:
        wallet = this.state.xDaiWallet;
        break;
    }

    wallet.sendTransaction({
      to: toAddress,
      value: amount
    });
  };

  setRoute = (route: Route) => {
    this.setState({ route });
  };

  setXDaiBalance = (xDaiBalance: ethers.utils.BigNumber) => {
    this.setState({ xDaiBalance });
  };

  setEthBalance = (ethBalance: ethers.utils.BigNumber) => {
    this.setState({ ethBalance });
  };

  setDaiBalance = (daiBalance: ethers.utils.BigNumber) => {
    this.setState({ daiBalance });
  };

  setTxns = async (transactions: Transaction[]) => {
    this.setState({ transactions });
  };
}
