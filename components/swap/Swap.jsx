"use client";

import Image from "next/image";
import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { getFullnodeUrl, SuiClient } from "@mysten/sui.js/client";
import { getAllExchanges } from "@/actions/ftassets.action";
import { calculateSwapAmountOut } from "../../actions/ftassets.action";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { COIN_TYPE } from "../../constant";
import TransactionOverview from "@/components/modal/TransactionOverview";
import AddLiquidityTransactionOverview from "@/components/modal/AddLiquidityTransactionOverview";
import SelectAsset from "@/components/modal/SelectAsset";
import ChainResult from "@/components/modal/ChainResult";
import { parseSui } from "../../utils/tools";
import TxToast from "@/components/ui/TxToast";
import toast from "react-hot-toast";
import coinInfo from "@/data/coin";
import config from "@/data/config";
import { SuiPriceServiceConnection } from "@pythnetwork/pyth-sui-js";
import CreatePoolOverview from "../modal/CreatePoolOverview";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

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
    signAndSubmitBCSTransaction,
    signTransaction,
    signMessage,
    signMessageAndVerify,
  } = useWallet();

  const [inputXAmount, setInputXAmount] = useState(0);
  const [inputYAmount, setInputYAmount] = useState(0);
  const [selectTokenX, setSelectTokenX] = useState("");
  const [selectTokenY, setSelectTokenY] = useState("");
  const [selectAction, setSelectAction] = useState("SWAP");
  const [selectTokenAsset, setSelectTokenAsset] = useState("");
  const [allExchanges, setAllExchanges] = useState([]);
  const [selectTokenXBalance, setSelectTokenXBalance] = useState([]);
  const [selectTokenYBalance, setSelectTokenYBalance] = useState([]);
  const [swapType, setSwapType] = useState("");
  const [swapRate, setSwapRate] = useState(0);
  const [slippage, setSlippage] = useState(0.5);
  const [yreserve, setYreserve] = useState(0);
  const [suiPrice, setSuiPrice] = useState(0);
  const [inputTokenXPrice, setInputTokenXPrice] = useState(0);
  const [inputTokenYPrice, setInputTokenYPrice] = useState(0);
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

  // useEffect(() => {
  //   // console.log('account.chains', wallet,account,wallet.address)
  //   initData();
  // }, []);
  // useEffect(() => {
  //   if (wallet.account !== undefined) {
  //     console.log("wallet", wallet);
  //     if (wallet.account.chains[0] === "sui:unknown") {
  //       setCurrentChain("m2");
  //       initData("m2");
  //     } else {
  //       setCurrentChain(wallet.account.chains[0]);
  //       initData(wallet.account.chains[0]);
  //     }
  //   }
  // }, [wallet]);
  // async function initData(_currentChain) {
  //   setAllExchanges((await getAllExchanges(_currentChain)).data);
  //   const connection = new SuiPriceServiceConnection(
  //     "https://hermes.pyth.network"
  //   );
  //   const priceIds = [
  //     "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
  //   ];
  //   const priceFeeds = await connection.getLatestPriceFeeds(priceIds);
  //   setSuiPrice(
  //     (priceFeeds[0].getPriceNoOlderThan(60).price / 10 ** 8).toFixed(2)
  //   );
  // }

  const handleXAmountChange = async (e) => {
    setInputXAmount(e.target.value);

    if (selectTokenX === "" || selectTokenY === "") {
      return;
    }
    queryPairAndAmountOut(
      parseInt(
        e.target.value * 10 ** coinInfo[currentChain][selectTokenX].decimals
      ),
      selectTokenX,
      selectTokenY,
      slippage
    );
    // arrangeCollectionsByTradingPair()
  };

  async function queryPair(tokenX, tokenY) {
    const { tokenPairs, swapType: _swapType } = queryTokenPairs(tokenX, tokenY);
    if (tokenPairs === "") {
      setInputYAmount(0);
      return {};
    }
    console.log("tokenPairs", tokenPairs);
    // const client = new SuiClient({
    //     url: getFullnodeUrl('testnet'),
    // });
    //
    // console.log('config[currentChain + "Url"]', config[currentChain + "Url"])
    const client = new SuiClient({
      url:
        currentChain === "m2"
          ? config[currentChain + "Url"]
          : getFullnodeUrl(config[currentChain + "Url"]),
    });
    const txn = await client.getObject({
      id: tokenPairs,
      // fetch the object content field
      options: { showContent: true },
    });
    console.log("pair info", txn);
    return { txn, _swapType };
  }

  async function queryPairAndAmountOut(
    _amountValue,
    tokenX,
    tokenY,
    _slippage
  ) {
    setOutputIsLoading(true);
    const { txn, _swapType } = await queryPair(tokenX, tokenY);
    if (txn === undefined) {
      return;
    }
    setSwapType(_swapType);
    console.log("handleXAmountChange", txn);
    // console.log("txn", txn)
    // console.log("txn", txn.data.content.fields.x_reserve)
    let amountOut;
    if (selectAction === "SWAP") {
      if (swapType === "swap_x" || _swapType === "swap_x") {
        amountOut = await calculateSwapAmountOut(
          txn.data.content.fields.x_reserve,
          txn.data.content.fields.y_reserve,
          _amountValue,
          currentChain,
          txn.data.content.fields.fee_numerator,
          txn.data.content.fields.fee_denominator
        );
        setSwapRate(
          txn.data.content.fields.x_reserve / txn.data.content.fields.y_reserve
        );
        setYreserve(txn.data.content.fields.y_reserve);
        setNumerator(txn.data.content.fields.fee_numerator);
        setDenominator(txn.data.content.fields.fee_denominator);
      } else {
        amountOut = await calculateSwapAmountOut(
          txn.data.content.fields.y_reserve,
          txn.data.content.fields.x_reserve,
          _amountValue,
          currentChain,
          txn.data.content.fields.fee_numerator,
          txn.data.content.fields.fee_denominator
        );
        setSwapRate(
          txn.data.content.fields.y_reserve / txn.data.content.fields.x_reserve
        );
        setYreserve(txn.data.content.fields.x_reserve);
        setNumerator(txn.data.content.fields.fee_numerator);
        setDenominator(txn.data.content.fields.fee_denominator);
      }
      console.log("amountOut api ", amountOut);
      const result =
        (amountOut.data * (1 - _slippage * 0.01)) /
        10 ** coinInfo[currentChain][tokenY].decimals;
      console.log("amountOut", result);
      setInputYAmount(result === undefined ? 0 : result.toFixed(2));
    } else if (selectAction === "ADDLIQUIDITY") {
      if (swapType === "swap_x") {
        amountOut = Math.floor(
          _amountValue /
            (txn.data.content.fields.x_reserve /
              txn.data.content.fields.y_reserve)
        );
        setNumerator(txn.data.content.fields.fee_numerator);
        setDenominator(txn.data.content.fields.fee_denominator);
      } else {
        amountOut = Math.floor(
          (txn.data.content.fields.x_reserve /
            txn.data.content.fields.y_reserve) *
            _amountValue
        );
        setNumerator(txn.data.content.fields.fee_numerator);
        setDenominator(txn.data.content.fields.fee_denominator);
      }
      // console.log('amountOut', amountOut)
      setInputYAmount(
        (amountOut / 10 ** coinInfo[currentChain][tokenY].decimals).toFixed(2)
      );
    }
    setOutputIsLoading(false);
  }

  const handleYAmountChange = async (e) => {
    setInputYAmount(e.target.value);
  };

  const handleSlippageChange = async (e) => {
    setSlippage(e.target.value);
    queryPairAndAmountOut(
      inputXAmount * 10 ** coinInfo[currentChain][selectTokenX].decimals,
      selectTokenX,
      selectTokenY,
      e.target.value
    );
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

  function doAction() {
    // if (inputXAmount === '' || inputXAmount === 0) {
    //     toast.custom(<TxToast title="please select token" digest={""}/>);
    //     return
    // }
    // if (inputYAmount === '' || inputYAmount === 0) {
    //     toast.custom(<TxToast title="please select token" digest={""}/>);
    //     return
    // }
    // if (selectTokenX === '') {
    //     toast.custom(<TxToast title="please select token" digest={""}/>);
    //     return
    // }
    // if (selectTokenY === '') {
    //     toast.custom(<TxToast title="please select token" digest={""}/>);
    //     return
    // }
    // if (inputXAmount > calculateBalance(selectTokenXBalance, selectTokenX)) {
    //     toast.custom(<TxToast title="Insufficient balance" digest={""}/>);
    //     return;
    // }
    const { status, info } = submitStatus();
    console.log("status, info", status, info);
    if (!status) {
      toast.custom(<TxToast title={info} digest={""} />);
      return;
    }
    const { tokenPairs, swapType } = queryTokenPairs(
      selectTokenX,
      selectTokenY
    );
    setSwapType(swapType);
    if (tokenPairs === "") {
      toast.custom(<TxToast title="don't have pool" digest={""} />);
      return;
    }
    let XAmount = parseInt(
      inputXAmount * 10 ** coinInfo[currentChain][selectTokenX].decimals
    );
    let YAmount = parseInt(
      inputYAmount * 10 ** coinInfo[currentChain][selectTokenY].decimals
    );
    if (selectAction === "SWAP") {
      swap(tokenPairs, swapType, XAmount, YAmount);
    } else if (selectAction === "ADDLIQUIDITY") {
      addLiquidity(tokenPairs, XAmount, YAmount);
    } else if (selectAction === "CREATE") {
      createPool(tokenPairs, XAmount, YAmount);
    }
  }

  function doSplitXCoin(txb, XAmount, YAmount) {
    let splitXCoin = "";
    if (
      selectTokenX ===
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
    console.log("selectTokenY", selectTokenY);
    let splitYCoin = "";
    if (
      selectTokenY ===
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
        await zero(selectTokenY, txb);
        // await selectToken(selectTokenY)
        let flag = true;
        while (flag) {
          const result = await getCoins(selectTokenY);
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
        selectTokenY ===
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
      // console.log('tx result', tx.effects.status.status)
      // console.log('tx result', tx.effects.status.error)
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

  // if (inputXAmount === '' || inputXAmount === 0) {
  //     toast.custom(<TxToast title="please select token" digest={""}/>);
  //     return
  // }
  // if (inputYAmount === '' || inputYAmount === 0) {
  //     toast.custom(<TxToast title="please select token" digest={""}/>);
  //     return
  // }
  // if (selectTokenX === '') {
  //     toast.custom(<TxToast title="please select token" digest={""}/>);
  //     return
  // }
  // if (selectTokenY === '') {
  //     toast.custom(<TxToast title="please select token" digest={""}/>);
  //     return
  // }
  // if (inputXAmount > calculateBalance(selectTokenXBalance, selectTokenX)) {
  //     toast.custom(<TxToast title="Insufficient balance" digest={""}/>);
  //     return;
  // }
  //
  function submitStatus() {
    if (inputXAmount === "" || inputXAmount === 0) {
      return { status: false, info: "please input amount" };
    }
    if (inputYAmount === "" || inputYAmount === 0) {
      return { status: false, info: "please input amount" };
    }
    if (selectTokenX === "") {
      return { status: false, info: "please select token" };
    }
    if (selectTokenY === "") {
      return { status: false, info: "please select token" };
    }
    if (
      Number(inputXAmount) + 0.01 >
      calculateBalance(selectTokenXBalance, selectTokenX)
    ) {
      return { status: false, info: "Insufficient balance" };
    }
    return { status: true, info: "" };
  }

  useEffect(() => {
    submitStatus();
  }, [inputXAmount, inputYAmount, selectTokenX, selectTokenY]);

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
        txb.pure.u64(slippage * 10),
        txb.pure.u64(1000),
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
    if (document.getElementById("select_asset_modal") === null) {
      return;
    }
    document.getElementById("select_asset_modal").close();
  }

  function closeSwapModal() {
    if (document.getElementById("transaction_overview_modal") === null) {
      return;
    }
    document.getElementById("transaction_overview_modal").close();
  }

  async function getCoins(coinAddress) {
    // const client = new SuiClient({
    //     url: getFullnodeUrl(account.chains[0].split(":")[1]),
    // });
    const client = new SuiClient({
      url:
        currentChain === "m2"
          ? config[currentChain + "Url"]
          : getFullnodeUrl(config[currentChain + "Url"]),
    });

    const txn2 = await client.getCoins({
      owner: account.address,
      coinType: coinAddress,
    });
    console.log("txn2", txn2);
    return txn2.data;
  }

  async function handleActionChange(value) {
    setSelectAction(value);
    if (value === "SWAP") {
      setSlippage(0.5);
    } else if (value === "CREATE") {
      setSlippage(0.3);
    }
    setShowDropDownContent(!showDropDownContent);
  }

  function calculateBalance(tokenBalance, selectToken) {
    let balance = 0;
    for (const item of tokenBalance) {
      balance = balance + parseInt(item.balance);
    }
    return (
      balance /
      10 ** coinInfo[currentChain]?.[selectToken]?.decimals
    ).toFixed(2);
  }

  function inputMaxAmount(tokenXOrY) {
    if (tokenXOrY === "X") {
      if (selectTokenX === "") {
        return;
      }
      const balanceX = calculateBalance(selectTokenXBalance, selectTokenX);
      setInputXAmount(balanceX);
      queryPairAndAmountOut(
        balanceX * 10 ** coinInfo[currentChain][selectTokenX].decimals,
        selectTokenX,
        selectTokenY,
        slippage
      );
    } else {
      if (selectTokenY === "") {
        return;
      }
      const balanceY = calculateBalance(selectTokenYBalance, selectTokenY);
      setInputYAmount(balanceY);
    }
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
    console.log("_selectTokenAsset", _selectTokenAsset, selectTokenAsset);
    if (_selectTokenAsset === "tokenx") {
      setSelectTokenX(tokenInfo);
      const result = await getCoins(tokenInfo);
      setSelectTokenXBalance(result);
      if (selectTokenY !== "") {
        queryPairAndAmountOut(
          inputXAmount * 10 ** coinInfo[currentChain][tokenInfo].decimals,
          tokenInfo,
          selectTokenY,
          slippage
        );
      }
    } else {
      setSelectTokenY(tokenInfo);
      const result = await getCoins(tokenInfo);
      setSelectTokenYBalance(result);
      if (selectTokenX !== "") {
        // 只能从x到y,没有开发y到x的兑换量
        queryPairAndAmountOut(
          inputXAmount * 10 ** coinInfo[currentChain][tokenInfo].decimals,
          selectTokenX,
          tokenInfo,
          slippage
        );
      }
    }
    setIsLoading(false);
    document.getElementById("select_asset_modal").close();
  }

  function openAssetModal(token) {
    setSelectTokenAsset(token);
    document.getElementById("select_asset_modal").showModal();
  }

  async function calculateInputPrice(amount, selectToken, xOrY) {
    let result = 0;
    if (selectToken === "") {
      result = 0;
    } else if (
      selectToken ===
      "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI"
    ) {
      result = amount * suiPrice;
    } else {
      const { txn, _swapType } = await queryPair(
        "0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
        selectToken
      );
      const amountOut = await calculateSwapAmountOut(
        txn.data.content.fields.y_reserve,
        txn.data.content.fields.x_reserve,
        amount * 10 ** coinInfo[currentChain][selectToken].decimals,
        currentChain,
        txn.data.content.fields.fee_numerator,
        txn.data.content.fields.fee_denominator
      );
      // await queryPairAndAmountOut(1000000000, '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI', selectToken, 0)
      console.log("resultresult", amountOut.data);
      result = (amountOut.data / 10 ** 9) * suiPrice;
    }
    if (xOrY === "X") {
      setInputTokenXPrice(result.toFixed(2));
    } else {
      setInputTokenYPrice(result.toFixed(2));
    }
  }

  function changeDropDownStatus() {
    setShowDropDownContent(!showDropDownContent);
  }

  useEffect(() => {
    calculateInputPrice(inputXAmount, selectTokenX, "X");
  }, [selectTokenX, inputXAmount]);

  useLayoutEffect(() => {
    // calculateInputPrice(inputXAmount, selectTokenX, 'X')
    console.log("width", ref.current.offsetWidth);
  });

  useEffect(() => {
    calculateInputPrice(inputYAmount, selectTokenY, "Y");
  }, [selectTokenY, inputYAmount]);

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
          className="flex flex-col items-center gap-[16px] max-[800px]:flex-col max-[800px]:items-center max-[800px]:w-[100%] min-[800px]:justify-center"
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
                onChange={handleXAmountChange}
                value={inputXAmount}
                type="text"
                className="mr-[0.5rem] bg-[#323232] text-white focus:outline-none flex-1 w-full text-[12px] "
                placeholder="Asset"
              />
              {/*<span className="text-white mr-[50px]">Asset</span>*/}

              <div
                onClick={() => openAssetModal("tokenx")}
                className="text-white bg-[#808080] p-[6px_4px] rounded-[0.5rem] flex items-center gap-[2px] cursor-pointer"
              >
                <span className="mr-[0.25rem] text-[12px]">
                  {selectTokenX === ""
                    ? "Select"
                    : selectTokenX.split("::")[2].length < 6
                    ? selectTokenX.split("::")[2]
                    : selectTokenX.split("::")[2].substr(0, 6) + "..."}
                </span>
                <Image alt="" src="/down.svg" width={20} height={20}></Image>
              </div>
              <button
                className="text-white flex h-[31px] p-[0px_8px] justify-center items-center gap-[10px] rounded-[8px] bg-[rgba(3,55,255,0.8)] border-none ml-[0.25rem] text-[12px]"
                onClick={() => inputMaxAmount("X")}
              >
                Max
              </button>
            </div>
            <div className="flex justify-between text-[0.55rem] text-[#808080] px-[16px] w-[100%]">
              <div>{"$ " + inputTokenXPrice}</div>
              <div>
                Balance:
                {calculateBalance(selectTokenXBalance, selectTokenX)}
              </div>
            </div>
          </div>

          <div className="mx-[2rem]">
            {selectAction === "SWAP" ? (
              <Image
                alt=""
                src="/swap-arrows.svg"
                width={38}
                height={46}
              ></Image>
            ) : (
              <Image src="/invert-arrows.svg" width={38} height={46}></Image>
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
                onChange={handleYAmountChange}
                value={inputYAmount}
                placeholder="Asset"
              />

              <div
                onClick={() => openAssetModal("tokeny")}
                className="text-white bg-[#808080] p-[6px_4px] rounded-[0.5rem] flex items-center gap-[2px] cursor-pointer"
              >
                <span className="mr-[0.25rem]  text-[12px]">
                  {selectTokenY === ""
                    ? "Select"
                    : selectTokenY.split("::")[2].length < 6
                    ? selectTokenY.split("::")[2]
                    : selectTokenY.split("::")[2].substr(0, 6) + "..."}
                </span>
                <Image alt="" src="/down.svg" width={20} height={20}></Image>
              </div>
              <button
                className="text-white flex h-[31px] p-[0px_8px] justify-center items-center gap-[10px] rounded-[8px] bg-[rgba(3,55,255,0.8)] border-none ml-[0.25rem] text-[12px]"
                onClick={() => inputMaxAmount("Y")}
              >
                Max
              </button>
            </div>
            <div className="flex justify-between text-[0.55rem] text-[#808080] px-[16px] w-[100%]">
              <span>{"$ " + inputTokenYPrice}</span>
              <span>
                Balance:
                {calculateBalance(selectTokenYBalance, selectTokenY)}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end	px-[1rem] gap-[4px] ml-auto">
            {selectAction === "SWAP" && (
              <>
                <div className="bg-[#323232] text-white rounded-[8px] overflow-hidden flex items-center py-[0.35rem] flex p-[4px_16px] items-center gap-[4px] w-[100px]">
                  <input
                    className="bg-[#323232] focus:outline-none text-[0.5rem]  w-[16px]"
                    onChange={handleSlippageChange}
                    value={slippage}
                    type="text"
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
            disabled={!submitStatus().status}
            className={` w-[320px] px-[64px] py-[8px] gap-[12px] bg-[#3556D5] border-none text-white text-[14px] rounded-[16px] ${
              !submitStatus().status
                ? "bg-[#939393]"
                : "shadow-[0px_0px_12px_0px_#3556D5]"
            }`}
            onClick={() => openModal()}
          >
            Confirm {submitStatus().status}
          </button>
          <ChainResult
            title={
              selectAction === "SWAP"
                ? "Swap submitted"
                : selectAction === "ADDLIQUIDITY"
                ? "Add liquidity submitted"
                : "Create pool submitted"
            }
            inputX={inputXAmount}
            inputY={inputYAmount}
            inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]}
            inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]}
            resultHash={resultHash}
            currentChain={currentChain}
            closeClick={closeChainResultModal}
          />
          <TransactionOverview
            handleClick={doAction}
            inputX={inputXAmount}
            inputY={inputYAmount}
            inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]}
            inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]}
            slippage={slippage}
            impact={(
              ((inputYAmount *
                10 ** coinInfo[currentChain]?.[selectTokenY]?.decimals) /
                yreserve) *
              100
            ).toFixed(2)}
            inputTokenXPrice={inputTokenXPrice}
            inputTokenYPrice={inputTokenYPrice}
            tokenXBalance={calculateBalance(selectTokenXBalance, selectTokenX)}
            tokenYBalance={calculateBalance(selectTokenYBalance, selectTokenY)}
            closeClick={closeSwapModal}
          />
          <AddLiquidityTransactionOverview
            handleClick={doAction}
            inputX={inputXAmount}
            inputY={inputYAmount}
            inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]}
            inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]}
            swapRate={swapRate}
            inputTokenXPrice={inputTokenXPrice}
            inputTokenYPrice={inputTokenYPrice}
            tokenXBalance={calculateBalance(selectTokenXBalance, selectTokenX)}
            tokenYBalance={calculateBalance(selectTokenYBalance, selectTokenY)}
            closeClick={closeLiquidityModal}
            numerator={numerator}
            denominator={denominator}
            impact={(
              ((inputYAmount *
                10 ** coinInfo[currentChain]?.[selectTokenY]?.decimals) /
                yreserve) *
              100
            ).toFixed(2)}
          />
          <CreatePoolOverview
            handleClick={doAction}
            inputX={inputXAmount}
            inputY={inputYAmount}
            inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]}
            inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]}
            swapRate={swapRate}
            inputTokenXPrice={inputTokenXPrice}
            inputTokenYPrice={inputTokenYPrice}
            tokenXBalance={calculateBalance(selectTokenXBalance, selectTokenX)}
            tokenYBalance={calculateBalance(selectTokenYBalance, selectTokenY)}
            closeClick={closeCreatePoolModal}
          />
          <SelectAsset
            handleClick={selectToken}
            currentChain={currentChain}
            isLoading={isLoading}
            closeClick={closeAssetModal}
            selectTokenAsset={selectTokenAsset}
          />
        </div>
      </div>
    </>
  );
}
