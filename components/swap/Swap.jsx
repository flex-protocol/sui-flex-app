"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { calculateSwapAmountOut } from "../../actions/ftassets.action";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { API_BASE_URL, COIN_TYPE } from "../../constant";
import SelectAsset from "@/components/modal/SelectAsset";
import TxToast from "@/components/ui/TxToast";
import toast from "react-hot-toast";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";
import { FlexSDK } from "flex-sdk-dev/src/index";

export default function Swap() {
  const {
    connect,
    account,
    network,
    connected,
    disconnect,
    wallet,
    wallets,
    signAndSubmitTransaction,
    signTransaction,
    signMessage,
    signMessageAndVerify,
  } = useWallet();

  const [inputXAmount, setInputXAmount] = useState("");
  const [inputYAmount, setInputYAmount] = useState("");
  const [selectAction, setSelectAction] = useState("SWAP");
  const [selectTokenAsset, setSelectTokenAsset] = useState("");
  const [allExchanges, setAllExchanges] = useState([]);

  const [swapType, setSwapType] = useState("");
  const [swapRate, setSwapRate] = useState(0);
  const [slippage, setSlippage] = useState("0.5");
  const [yreserve, setYreserve] = useState(0);
  const [resultHash, setResultHash] = useState("");
  const [currentChain, setCurrentChain] = useState("sui:testnet");
  const [isLoading, setIsLoading] = useState(false);
  const [outputIsLoading, setOutputIsLoading] = useState(false);
  const [denominator, setDenominator] = useState(false);
  const [numerator, setNumerator] = useState(false);
  const [xTypeArg, setXTypeArg] = useState("");
  const [yTypeArg, setYTypeArg] = useState("");
  const [showDropDownContent, setShowDropDownContent] = useState(false);
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  const [flexSdk, setFlexSdk] = useState(null);
  const [tokenX, setTokenX] = useState(null);
  const [tokenY, setTokenY] = useState(null);
  const [tokenXPrice, setTokenXPrice] = useState(0);
  const [tokenYPrice, setTokenYPrice] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const sdk = new FlexSDK({
      network: Network.CUSTOM,
      fullnode: "https://aptos.testnet.porto.movementlabs.xyz/v1",
      indexer: "https://indexer.testnet.porto.movementnetwork.xyz/v1/graphql",
    });
    setFlexSdk(sdk);
  }, []);

  const handleSlippageChange = (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, "");
    // Only allow one decimal point and one digit after decimal
    if (value === "" || /^\d*\.?\d{0,1}$/.test(value)) {
      setSlippage(value);
    }
  };

  function queryBalanceObj(tokenBalance, inputAmount, XorY) {
    // console.log('tokenBalance', tokenBalance, inputAmount)
    for (const item of tokenBalance) {
      if (XorY === "Y") {
        return item;
      }
      if (parseInt(item.balance) > inputAmount) {
        // console.log('item', item)
        return item;
      }
    }
    return "";
  }

  function queryTokenPairs(tokenX, tokenY) {
    let tokenPairs = "";
    for (const item of allExchanges) {
      let tempTokenX = item.x_TokenTypes[0];
      if (
        item.x_TokenTypes[0].indexOf("sui") === -1 &&
        !item.x_TokenTypes[0].startsWith("0x")
      ) {
        tempTokenX = "0x" + item.x_TokenTypes[0];
      }
      let tempTokenY = item.y_TokenTypes[0];
      if (
        item.y_TokenTypes[0].indexOf("sui") === -1 &&
        !item.y_TokenTypes[0].startsWith("0x")
      ) {
        tempTokenY = "0x" + item.y_TokenTypes[0];
      }

      setXTypeArg(item.x_TokenTypes[0]);
      setYTypeArg(item.y_TokenTypes[0]);

      if (tempTokenX === tokenX && tempTokenY === tokenY) {
        tokenPairs = item.tokenPairs[0];
        return { tokenPairs, swapType: "swap_x" };
      } else if (tempTokenX === tokenY && tempTokenY === tokenX) {
        tokenPairs = item.tokenPairs[0];
        return { tokenPairs: tokenPairs, swapType: "swap_y" };
      }
    }
    return { tokenPairs: "", swapType: "" };
  }

  function doSplitXCoin(txb, XAmount, YAmount) {
    let splitXCoin = "";
    if (
      tokenX ===
      "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    ) {
      splitXCoin = txb.splitCoins(txb.gas, [txb.pure(XAmount)]);
      return splitXCoin;
    } else {
      const tempBalanceObj = queryBalanceObj(selectTokenXBalance, XAmount, "X");
      if (tempBalanceObj !== "") {
        splitXCoin = tempBalanceObj.coinObjectId;
      } else {
      }
    }
    return splitXCoin;
  }

  async function doSplitYCoin(txb, XAmount, YAmount) {
    console.log("selectTokenY", tokenY);
    let splitYCoin = "";
    if (
      tokenY ===
      "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    ) {
      splitYCoin = txb.splitCoins(txb.gas, [txb.pure(YAmount)]);
    } else {
      const tempBalanceObj = queryBalanceObj(selectTokenYBalance, YAmount, "Y");
      if (tempBalanceObj !== "") {
        splitYCoin = tempBalanceObj.coinObjectId;
      } else {
        // 创建个0 objectid
        // '0x71ec440c694153474dd2a9c5c19cf60e2968d1af51aacfa24e34ee96a2df44dd::example_coin::EXAMPLE_COIN'
        await zero(tokenY, txb);
        // await selectToken(selectTokenY)
        let flag = true;
        while (flag) {
          const result = await getCoins(tokenY);
          if (
            result !== undefined &&
            result !== null &&
            result[0] !== undefined
          ) {
            splitYCoin = result[0].coinObjectId;
            flag = false;
          } else {
            await new Promise((r) => setTimeout(r, 500));
          }
        }
        // splitYCoin = doSplitYCoin(txb, XAmount, YAmount)
      }
    }
    return splitYCoin;
  }

  async function zero(typeArg, txb) {
    console.log("selectTokenY", typeArg);
    try {
      const txb2 = new TransactionBlock();
      const resultObjectId = txb2.moveCall({
        target: `0x2::coin::zero`,
        arguments: [],
        typeArguments: [typeArg],
      });
      console.log("moveCallresult", resultObjectId);
      txb2.transferObjects(
        [resultObjectId],
        txb2.pure.address(account.address)
      );
      const res = await signAndExecuteTransactionBlock({
        transactionBlock: txb2,
      });
      console.log("res", res, resultObjectId, txb2);
      return resultObjectId;

      // console.log('chain result', res)
      // setResultHash(res.digest)
      // document.getElementById('transaction_overview_modal').close()
      // document.getElementById('my_modal_2').showModal()

      // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
    } catch (error) {
      console.log("swap error", error);
      // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
      // toast.error(`Failed to add token to sell pool: ${error.message}.`);
    }
  }

  async function swap(tokenPairs, swapType, XAmount, YAmount) {
    try {
      // console.log('wallet.account', wallet.account)
      const txb = new TransactionBlock();
      txb.setGasBudget(10000000);
      const splitXCoin = doSplitXCoin(txb, XAmount, YAmount);
      const splitYCoin = await doSplitYCoin(txb, XAmount, YAmount);
      let param = [
        txb.object(tokenPairs),
        txb.object(splitXCoin),
        txb.pure.u64(XAmount),
        txb.object(splitYCoin),
        txb.pure.u64(YAmount),
      ];
      // console.log('param', param, COIN_TYPE)
      txb.moveCall({
        target: `${
          config[currentChain + "CORE_PACKAGE_ID"]
        }::token_pair_service::${swapType}`,
        arguments: param,
        typeArguments: [xTypeArg, yTypeArg],
      });
      if (
        tokenY ===
        "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
      ) {
        txb.transferObjects([splitYCoin], txb.pure.address(account.address));
      }
      const res = await signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });
      // console.log('chain result', res)
      // const client = new SuiClient({
      //     url: currentChain === 'm2' ? config[currentChain + "Url"] : getFullnodeUrl(config[currentChain + "Url"]),
      // });
      // const digest = res.digest
      // const tx = await client.waitForTransactionBlock({
      //     digest: digest,
      //     options: {
      //         showEffects: true,
      //     },
      // });
      // console.log('tx result', tx)
      setResultHash(res.digest);
      document.getElementById("transaction_overview_modal").close();
      document.getElementById("my_modal_2").showModal();

      // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
    } catch (error) {
      console.log("swap error", error);
      // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
      // toast.error(`Failed to add token to sell pool: ${error.message}.`);
    }
  }

  async function addLiquidity(tokenPairs, XAmount, YAmount) {
    try {
      const txb = new TransactionBlock();
      txb.setGasBudget(10000000);
      const splitXCoin = doSplitXCoin(txb, XAmount, YAmount);
      const splitYCoin = await doSplitYCoin(txb, XAmount, YAmount);
      let param = "";
      if (swapType === "swap_x") {
        param = [
          txb.object(tokenPairs),
          txb.object(splitXCoin),
          txb.pure.u64(XAmount),
          txb.object(splitYCoin),
          txb.pure.u64(YAmount),
          txb.pure([]),
        ];
      } else {
        param = [
          txb.object(tokenPairs),
          txb.object(splitYCoin),
          txb.pure.u64(YAmount),
          txb.object(splitXCoin),
          txb.pure.u64(XAmount),
          txb.pure([]),
        ];
      }
      console.log("param", param, COIN_TYPE);
      txb.moveCall({
        target: `${
          config[currentChain + "CORE_PACKAGE_ID"]
        }::token_pair_service::add_liquidity`,
        arguments: param,
        typeArguments: [xTypeArg, yTypeArg],
      });

      const res = await signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });
      // const digest = res.digest
      // console.log('chain result', res)
      // console.log('chain result', res.digest)
      // const client = new SuiClient({
      //     url: currentChain === 'm2' ? config[currentChain + "Url"] : getFullnodeUrl(config[currentChain + "Url"]),
      // });
      // const tx = await client.waitForTransactionBlock({
      //     digest: digest,
      //     options: {
      //         showEffects: true,
      //     },
      // });
      // console.log('tx result', tx)
      setResultHash(res.digest);
      document
        .getElementById("add_liquidity_transaction_overview_modal")
        .close();
      document.getElementById("my_modal_2").showModal();

      // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
    } catch (error) {
      console.log("swap error", error);
      // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
      // toast.error(`Failed to add token to sell pool: ${error.message}.`);
    }
  }

  async function createPool(tokenPairs, XAmount, YAmount) {
    if (slippage < 0.1) {
      toast.custom(<TxToast title={"LP Fee to small"} digest={""} />);
      return;
    }
    try {
      const txb = new TransactionBlock();
      txb.setGasBudget(10000000);
      const splitXCoin = doSplitXCoin(txb, XAmount, YAmount);
      const splitYCoin = await doSplitYCoin(txb, XAmount, YAmount);
      let param = [
        txb.object(splitXCoin),
        txb.pure.u64(XAmount),
        txb.object(splitYCoin),
        txb.pure.u64(YAmount),
        ...getSlippageRatio(slippage),
      ];
      console.log("param", param, COIN_TYPE);
      txb.moveCall({
        target: `${
          config[currentChain + "CORE_PACKAGE_ID"]
        }::token_pair_service::initialize_liquidity`,
        arguments: param,
        typeArguments: [xTypeArg, yTypeArg],
      });

      const res = await signAndExecuteTransactionBlock({
        transactionBlock: txb,
      });
      const digest = res.digest;
      // console.log('chain result', res)
      // console.log('chain result', res.digest)
      const client = new SuiClient({
        url:
          currentChain === "m2"
            ? config[currentChain + "Url"]
            : getFullnodeUrl(config[currentChain + "Url"]),
      });
      const tx = await client.waitForTransactionBlock({
        digest: digest,
        options: {
          showEffects: true,
        },
      });
      console.log("tx result", tx);
      setResultHash(res.digest);
      document.getElementById("create_pool_overview_modal").close();
      document.getElementById("my_modal_2").showModal();

      // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
    } catch (error) {
      console.log("swap error", error);
      // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
      // toast.error(`Failed to add token to sell pool: ${error.message}.`);
    }
  }

  function closeLiquidityModal() {
    if (
      document.getElementById("add_liquidity_transaction_overview_modal") ===
      null
    ) {
      return;
    }
    document.getElementById("add_liquidity_transaction_overview_modal").close();
  }

  function closeChainResultModal() {
    if (document.getElementById("my_modal_2") === null) {
      return;
    }
    document.getElementById("my_modal_2").close();
  }

  function closeCreatePoolModal() {
    if (document.getElementById("create_pool_overview_modal") === null) {
      return;
    }
    document.getElementById("create_pool_overview_modal").close();
  }

  function closeAssetModal() {
    setIsModalOpen(false);
  }

  function closeSwapModal() {
    if (document.getElementById("transaction_overview_modal") === null) {
      return;
    }
    document.getElementById("transaction_overview_modal").close();
  }

  async function handleActionChange(value) {
    setSelectAction(value);
    if (value === "SWAP") {
      setSlippage("0.5");
    } else if (value === "CREATE") {
      setSlippage("0.3");
    }
    setShowDropDownContent(!showDropDownContent);
  }

  function openModal() {
    if (selectAction === "SWAP") {
      document.getElementById("transaction_overview_modal").showModal();
    } else if (selectAction === "ADDLIQUIDITY") {
      document
        .getElementById("add_liquidity_transaction_overview_modal")
        .showModal();
    } else if (selectAction === "CREATE") {
      document.getElementById("create_pool_overview_modal").showModal();
    }
  }

  async function selectToken(tokenInfo, _selectTokenAsset) {
    setIsLoading(true);

    try {
      if (_selectTokenAsset === "tokenx") {
        setTokenX(tokenInfo);
      } else {
        setTokenY(tokenInfo);
      }

      setIsModalOpen(false);
      setIsLoading(false);
    } catch (error) {
      console.error("Error selecting token:", error);
      setIsLoading(false);
    }
  }

  function openAssetModal(token) {
    setSelectTokenAsset(token);
    setIsModalOpen(true);
  }

  return (
    <>
      <div className="relative flex flex-col justify-center items-center gap-[16px] mt-[32px] text-[#030201]">
        <div
          className={`w-[480px] max-[480px]:w-[100%] flex flex-col gap-[16px]`}
        >
          <div
            style={{
              color: "#030201",
              textAlign: "left",
              fontFamily: "TWK Everett Mono",
              fontSize: "32px",
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "140%",
            }}
          >
            {selectAction === "SWAP"
              ? "Swap Anything"
              : selectAction === "CREATE"
              ? "Create Pool"
              : "Add Liquidity"}
          </div>
          <div
            style={{
              color: "#030201",
              textAlign: "right",
              fontFamily: "TWK Everett Mono",
              fontSize: "32px",
              fontStyle: "normal",
              fontWeight: 700,
              lineHeight: "140%",
            }}
          >
            Anytime Anywhere
          </div>
        </div>
        <div
          ref={ref}
          className="flex flex-col items-center gap-[16px] max-[800px]:flex-col max-[800px]:items-center min-[800px]:justify-center"
        >
          <div className="flex p-[8px_16px] items-center gap-[16px] rounded-[16px] bg-[rgba(255,255,255,0.3)]">
            <button
              onClick={() => handleActionChange("SWAP")}
              className={`font-['TwkeRegular'] text-[14px] font-[500] transition-colors flex p-[2px_8px] justify-center items-center gap-[10px] rounded-[8px] ${
                selectAction === "SWAP"
                  ? "bg-[rgba(3,55,255,0.8)] text-white"
                  : ""
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => handleActionChange("CREATE")}
              className={`font-['TwkeRegular'] text-[14px] font-[500] transition-colors flex p-[2px_8px] justify-center items-center gap-[10px] rounded-[8px] ${
                selectAction === "CREATE"
                  ? "bg-[rgba(3,55,255,0.8)] text-white"
                  : ""
              }`}
            >
              Create
            </button>
            <button
              onClick={() => handleActionChange("ADDLIQUIDITY")}
              className={`font-['TwkeRegular'] text-[14px] font-[500] transition-colors flex p-[2px_8px] justify-center items-center gap-[10px] rounded-[8px] ${
                selectAction === "ADDLIQUIDITY"
                  ? "bg-[rgba(3,55,255,0.8)] text-white"
                  : ""
              }`}
            >
              Add Liquidity
            </button>
          </div>

          <div className="flex flex-col items-start p-[8px_16px] gap-[4px] rounded-[16px] bg-[rgba(255,255,255,0.60)] shadow-[0px_0px_8px_0px_rgba(0,0,0,0.32)]  w-[320px]">
            <div className="font-[400] text-[12px]">
              {selectAction === "SWAP" ? "You pay" : "Select Asset"}
            </div>
            <div className="flex items-center bg-[#323232] rounded-[0.5rem] py-[0.25rem] px-[1rem]">
              <input
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setInputXAmount(value);
                  }
                }}
                value={inputXAmount}
                type="text"
                className="mr-[0.5rem] bg-[#323232] text-white focus:outline-none flex-1 w-full text-[12px]"
                placeholder="Asset"
              />

              <div
                onClick={() => openAssetModal("tokenx")}
                className="text-white bg-[#808080] p-[6px_4px] rounded-[0.5rem] flex items-center gap-[2px] cursor-pointer"
              >
                <span className="mr-[0.25rem] text-[12px]">
                  {tokenX ? tokenX.symbol : "Select"}
                </span>
                <Image
                  alt="down arrow"
                  src="/down.svg"
                  width={20}
                  height={20}
                ></Image>
              </div>
              <button
                className="text-white flex h-[31px] p-[0px_8px] justify-center items-center gap-[10px] rounded-[8px] bg-[rgba(3,55,255,0.8)] border-none ml-[0.25rem] text-[12px]"
                onClick={() => inputMaxAmount("X")}
              >
                Max
              </button>
            </div>
            <div className="flex justify-between text-[0.55rem] text-[#808080] px-[16px] w-[100%]">
              <div>
                {inputXAmount && tokenXPrice
                  ? `$ ${(parseFloat(inputXAmount) * tokenXPrice).toFixed(2)}`
                  : "$ -"}
              </div>
              <div>{`Balance: ${tokenX ? tokenX.balance : "-"}`}</div>
            </div>
          </div>

          <div className="mx-[2rem]">
            {selectAction === "SWAP" ? (
              <Image
                alt="swap arrows"
                src="/swap-arrows.svg"
                width={38}
                height={46}
              ></Image>
            ) : (
              <Image
                src="/invert-arrows.svg"
                width={38}
                height={46}
                alt="invert arrows"
              ></Image>
            )}
          </div>

          <div className="flex flex-col items-start p-[8px_16px] gap-[4px] rounded-[16px] bg-[rgba(255,255,255,0.60)] shadow-[0px_0px_8px_0px_rgba(0,0,0,0.32)]  w-[320px]">
            <div className="font-[400] flex text-[12px]">
              {selectAction === "SWAP" ? "You Receive" : "Select Asset"}
              {outputIsLoading && (
                <span className="ml-3 loading loading-spinner loading-sm color-white"></span>
              )}
            </div>
            <div className="flex items-center bg-[#323232] rounded-[0.5rem] py-[0.25rem] px-[1rem]">
              <input
                type="text"
                className="mr-[0.5rem] bg-[#323232] text-white focus:outline-none flex-1 w-full text-[12px]"
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.]/g, "");
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    setInputYAmount(value);
                  }
                }}
                value={inputYAmount}
                placeholder="Asset"
              />

              <div
                onClick={() => openAssetModal("tokeny")}
                className="text-white bg-[#808080] p-[6px_4px] rounded-[0.5rem] flex items-center gap-[2px] cursor-pointer"
              >
                <span className="mr-[0.25rem] text-[12px]">
                  {tokenY ? tokenY.symbol : "Select"}
                </span>
                <Image
                  alt="down arrow"
                  src="/down.svg"
                  width={20}
                  height={20}
                ></Image>
              </div>
              <button
                className="text-white flex h-[31px] p-[0px_8px] justify-center items-center gap-[10px] rounded-[8px] bg-[rgba(3,55,255,0.8)] border-none ml-[0.25rem] text-[12px]"
                onClick={() => inputMaxAmount("Y")}
              >
                Max
              </button>
            </div>
            <div className="flex justify-between text-[0.55rem] text-[#808080] px-[16px] w-[100%]">
              <div>
                {inputYAmount && tokenYPrice
                  ? `$ ${(parseFloat(inputYAmount) * tokenYPrice).toFixed(2)}`
                  : "$ -"}
              </div>
              <div>{`Balance: ${tokenY ? tokenY.balance : "-"}`}</div>
            </div>
          </div>

          <div className="flex flex-col items-end px-[1rem] gap-[4px] ml-auto">
            {selectAction === "SWAP" && (
              <>
                <div className="bg-[#323232] text-white rounded-[8px] overflow-hidden flex items-center py-[0.35rem] flex p-[4px_16px] items-center gap-[4px] w-[100px]">
                  <input
                    className="bg-[#323232] focus:outline-none text-[0.5rem] w-[16px]"
                    onChange={handleSlippageChange}
                    value={slippage}
                    type="text"
                    inputMode="decimal"
                  />
                  <span className="text-[#808080] text-[0.5rem] ">
                    % Slippage
                  </span>
                </div>
                <div className="text-[#0337FFCC] text-[0.5rem] text-right">
                  0.5% Recommended
                </div>
              </>
            )}
            {selectAction === "CREATE" && (
              <>
                <div className="bg-[#323232] text-white rounded-[8px] overflow-hidden flex items-center py-[0.35rem] flex p-[4px_16px] items-center gap-[4px] w-[100px]">
                  <input
                    className="bg-[#323232]  focus:outline-none text-[0.5rem] w-[16px]"
                    onChange={handleSlippageChange}
                    value={slippage}
                    type="text"
                    inputMode="decimal"
                  />
                  <span className=" text-[#808080] text-[0.5rem]">
                    % LP Fee
                  </span>
                </div>
                <div className="text-[#0337FFCC] text-[0.5rem] text-right">
                  0.3% Recommended
                </div>
              </>
            )}
          </div>

          <button
            disabled={
              inputXAmount === "" ||
              inputYAmount === "" ||
              tokenX === null ||
              tokenY === null
            }
            className={` w-[320px] px-[64px] py-[8px] gap-[12px] bg-[#3556D5] border-none text-white text-[14px] rounded-[16px] ${
              inputXAmount === "" ||
              inputYAmount === "" ||
              tokenX === null ||
              tokenY === null
                ? "bg-[#939393]"
                : "shadow-[0px_0px_12px_0px_#3556D5]"
            }`}
            onClick={async () => {
              switch (selectAction) {
                case "SWAP":
                  try {
                    const poolIdRes = await fetch(
                      `${API_BASE_URL}/TokenPairs/by-token-types?xTokenType=${tokenX.type}&yTokenType=${tokenY.type}`
                    );
                    const poolIdResJson = await poolIdRes.json();

                    console.log("poolIdResJson", poolIdResJson);
                    const poolId = poolIdResJson.reduce((prev, current) => {
                      if (
                        parseFloat(current.x_ReserveValue) >=
                          parseFloat(
                            parseFloat(inputXAmount) * 10 ** tokenX.decimals
                          ) &&
                        parseFloat(current.y_ReserveValue) >=
                          parseFloat(
                            parseFloat(inputYAmount) * 10 ** tokenY.decimals
                          )
                      ) {
                        return current.id;
                      }
                      return prev;
                    }, "");

                    if (!poolId) {
                      toast.error("No valid pool found");
                      return;
                    }

                    const swapCoinData = await flexSdk.coinModule.swapCoinData(
                      poolId,
                      true,
                      parseFloat(inputXAmount) * 10 ** tokenX.decimals,
                      0
                    );

                    const response = await signAndSubmitTransaction({
                      sender: account.address,
                      data: swapCoinData,
                    });

                    console.log(response);

                    await flexSdk.aptosClient.waitForTransaction({
                      transactionHash: response.hash,
                    });

                    // Show success toast
                    toast.success("Transaction submitted successfully!");
                  } catch (error) {
                    console.error("Error submitting transaction:", error);
                    toast.error(
                      "Failed to submit transaction: " + error.message
                    );
                  }
                  break;
                case "CREATE":
                  try {
                    const response = await signAndSubmitTransaction({
                      sender: account.address,
                      data: flexSdk.coinModule.createCoinPoolData(
                        tokenX.type,
                        tokenY.type,
                        parseFloat(inputXAmount) * 10 ** tokenX.decimals,
                        parseFloat(inputYAmount) * 10 ** tokenY.decimals,
                        parseFloat(slippage) * 10,
                        1000
                      ),
                    });

                    console.log(response);
                    await flexSdk.aptosClient.waitForTransaction({
                      transactionHash: response.hash,
                    });

                    // Show success toast
                    toast.success("Transaction submitted successfully!");
                  } catch (error) {
                    console.error("Error submitting transaction:", error);
                    toast.error(
                      "Failed to submit transaction: " + error.message
                    );
                  }
                  break;
                case "ADDLIQUIDITY":
                  break;
                default:
                  break;
              }
            }}
          >
            Confirm
          </button>

          <SelectAsset
            handleClick={selectToken}
            isLoading={isLoading}
            closeClick={closeAssetModal}
            selectTokenAsset={selectTokenAsset}
            accountAddress={account?.address}
            flexSdk={flexSdk}
            isOpen={isModalOpen}
          />
        </div>
      </div>
    </>
  );
}
