// Assets need a ticker, address(sc), chain, decimal config and price.
import { chains, ChainId } from "./chains";

export interface asset {
  ticker: string;
  address: string;
  chain: ChainId;
  decimalParsing?: number;
  price: number;
}

export const assets{
btc,
eth,
}
