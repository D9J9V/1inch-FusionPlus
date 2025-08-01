// Assets need a ticker, address(sc), chain, decimal config and price.
import { chains, ChainId } from "./chains";

export interface asset {
  ticker: string;
  address: string;
  chain: ChainId;
  decimalParsing?: number;
  price: number;
}

export const assets = {
  btc: {
    ticker: "BTC",
    address: "0x0000000000000000000000000000000000000000", // Native asset
    chain: ChainId.LIGHTNING,
    decimalParsing: 8,
    price: 0 // To be fetched
  },
  eth: {
    ticker: "ETH",
    address: "0x0000000000000000000000000000000000000000", // Native asset
    chain: ChainId.ETHEREUM,
    decimalParsing: 18,
    price: 0 // To be fetched
  }
};
