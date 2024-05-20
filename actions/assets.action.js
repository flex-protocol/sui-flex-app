"use server";

import axios from "axios";

import { COIN_TYPE, offchainBaseUrl } from "@/constant";

export async function getAllCollections() {
  try {
    const { data } = await axios.get(`${offchainBaseUrl}/api/NftCollections`);
    return { data, errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}

export async function getCollectionByType({ collectionType }: { collectionType: string }) {
  try {
    const { data } = await axios.get(`${offchainBaseUrl}/api/NftCollections?collectionType=${collectionType}`);
    return { data: data[0], errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}

export async function getOwnedAssetsByType({ address, collectionType }: { address: string; collectionType: string }) {
  try {
    const { data } = await axios.get(
      `${offchainBaseUrl}/api/nftPools/ownedAssets?nftType=${collectionType}&address=${address}`
    );
    return { data, errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}

export async function getAssetsByType({
  collectionType,
  liquidityTokenObjectId,
  poolObjectId,
}: {
  collectionType: string;
  liquidityTokenObjectId?: string;
  poolObjectId?: string;
}) {
  try {
    const { data } = await axios.get(
      `${offchainBaseUrl}/api/nftPools/assets?nftType=${collectionType}&coinType=${COIN_TYPE}${
        liquidityTokenObjectId ? `&liquidityTokenObjectId=${liquidityTokenObjectId}` : ""
      }${poolObjectId ? `&poolObjectId=${poolObjectId}` : ""}&showDisplay=true`
    );
    return { data, errMsg: "" };
  } catch (error: any) {
    return { data: null, errMsg: error.message };
  }
}
