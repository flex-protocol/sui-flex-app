"use server";

import axios from "axios";

import { offchainBaseUrl } from "@/constant";

// Get all owned pools
export async function getOwnedPools({ address }: { address: string }) {
  try {
    const { data } = await axios.get(`${offchainBaseUrl}/api/nftPools/ownedPools?address=${address}`);
    return { data, errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}

// Get sorted pools for swap buy (i.e. sell pools and trade pools)
export async function getBuySpotPrices({ collectionType, coinType }: { collectionType: string; coinType: string }) {
  try {
    const { data } = await axios.get(
      `${offchainBaseUrl}/api/nftPools/buySpotPrices?nftType=${collectionType}&coinType=${coinType}&nftAmountLimit=${100}`
    );
    return { data, errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}

// Get sorted pools for swap sell (i.e. buy pools and trade pools)
export async function getSellSpotPrices({ collectionType, coinType }: { collectionType: string; coinType: string }) {
  try {
    const { data } = await axios.get(
      `${offchainBaseUrl}/api/nftPools/sellSpotPrices?nftType=${collectionType}&coinType=${coinType}&nftAmountLimit=${100}`
    );
    return { data, errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}

export async function calculateCoinForInitBuyPool({
  collectionType,
  basicUnitQuantity,
  curveType,
  startPriceNumerator,
  startPriceDenominator,
  priceDeltaNumerator,
  priceDeltaDenominator,
}: {
  collectionType: string;
  basicUnitQuantity: number;
  curveType: 0 | 1;
  startPriceNumerator: string;
  startPriceDenominator: string;
  priceDeltaNumerator: string;
  priceDeltaDenominator: string;
}) {
  try {
    const { data } = await axios.get(
      `${offchainBaseUrl}/api/nftPools/calculateCoinAmountNeededForBuyPool?nftType=${collectionType}&nftBasicUnitQuantity=${basicUnitQuantity}&curveType=${curveType}&startPriceNumerator=${startPriceNumerator}&startPriceDenominator=${startPriceDenominator}&priceDeltaNumerator=${priceDeltaNumerator}&priceDeltaDenominator=${priceDeltaDenominator}`
    );
    return { data, errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}
