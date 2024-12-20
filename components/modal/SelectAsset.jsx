"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function SelectAsset({
  handleClick,
  currentChain,
  isLoading,
  closeClick,
  selectTokenAsset,
  accountAddress,
  flexSdk,
  isOpen,
}) {
  const [searchValue, setSearchValue] = useState("");
  const [availableCoins, setAvailableCoins] = useState([]);
  const [isLoadingCoins, setIsLoadingCoins] = useState(false);

  async function getAccountCoinsWithBalances(accountAddress) {
    try {
      if (!flexSdk) return null;

      // Get list of all coins for the account
      const coins = await flexSdk.fetchAccountCoins(accountAddress);

      // Format the data with calculated formatted balance
      const coinsWithBalances = coins.map((coin) => ({
        ...coin,
        // Add formatted balance with decimals
        formattedBalance: coin.amount / Math.pow(10, coin.metadata.decimals),
        // Quick access to common properties
        symbol: coin.metadata.symbol,
        name: coin.metadata.name,
        decimals: coin.metadata.decimals,
      }));

      return coinsWithBalances;
    } catch (error) {
      console.error("Error fetching account coins and balances:", error);
      return null;
    }
  }

  useEffect(() => {
    if (isOpen && accountAddress && flexSdk) {
      setIsLoadingCoins(true);
      getAccountCoinsWithBalances(accountAddress)
        .then((coins) => {
          setAvailableCoins(coins || []);
        })
        .finally(() => {
          setIsLoadingCoins(false);
        });
    }
  }, [accountAddress, flexSdk, isOpen]);

  const assetList = availableCoins
    .filter(
      (coin) =>
        coin.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        coin.symbol.toLowerCase().includes(searchValue.toLowerCase())
    )
    .map((coin) => (
      <div
        key={coin.asset_type}
        className="flex p-[0px_16px] items-center gap-[8px] cursor-pointer hover:bg-gray-100 rounded-lg"
        onClick={() =>
          handleClick(
            {
              amount: coin.amount,
              type: coin.asset_type,
              name: coin.name,
              symbol: coin.symbol,
              balance: coin.formattedBalance,
              decimals: coin.decimals,
            },
            selectTokenAsset
          )
        }
      >
        <div className="w-8 h-8">
          <Image
            src="/icon/sui.svg"
            alt={coin.symbol}
            width={32}
            height={32}
            className="rounded-full"
          />
        </div>
        <div className="flex flex-col flex-1 gap-[4px]">
          <div className="flex items-center gap-[4px]">
            <span className="text-[12px]">{coin.name}</span>
            <span className="text-[8px]">{coin.symbol}</span>
          </div>
          <div className="text-[12px]">Balance: {coin.formattedBalance}</div>
        </div>
      </div>
    ));

  const searchAsset = async (e) => {
    setSearchValue(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-[420px] gap-[8px] flex flex-col">
        <div className="flex px-[8px] items-center gap-[8px]">
          <Image
            alt="Close"
            onClick={closeClick}
            className="cursor-pointer"
            src="/close.svg"
            width={24}
            height={24}
          />
          <span
            style={{
              color: "#2D2D2D",
              fontFamily: "TWK Everett Mono",
              fontSize: "14px",
              fontStyle: "normal",
              fontWeight: 400,
              lineHeight: "140%",
              letterSpacing: "0.2px",
            }}
          >
            Select Asset
          </span>
        </div>

        <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-gray-300">
          <Image
            src="/search-md.svg"
            alt="Search"
            width={16}
            height={16}
            className="text-gray-500"
          />
          <input
            placeholder="Search Name or Address"
            className="w-full bg-transparent focus:outline-none text-[#2D2D2D] text-left font-['TWK_Everett_Mono'] text-[12px] font-[400] leading-[140%] tracking-[0.2px]"
            type="text"
            onChange={searchAsset}
            value={searchValue}
          />
        </div>

        <div className="max-h-[400px] overflow-y-auto flex-col flex gap-[16px]">
          {isLoadingCoins ? (
            <div className="flex justify-center items-center py-4">
              <span className="loading loading-spinner loading-md"></span>
            </div>
          ) : (
            assetList
          )}
        </div>
      </div>
    </div>
  );
}
