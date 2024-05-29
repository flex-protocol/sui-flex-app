"use client";

import Image from "next/image";
import {useAccountBalance, useSuiProvider, useWallet} from "@suiet/wallet-kit";
import {useEffect, useState} from "react";
import {getFullnodeUrl, SuiClient} from '@mysten/sui.js/client';
import {getAllExchanges} from "@/actions/ftassets.action";
import {calculateSwapAmountOut} from "../../actions/ftassets.action";
import {TransactionBlock} from "@mysten/sui.js/transactions";
import {COIN_TYPE} from "../../constant";
import TransactionOverview from "@/components/modal/TransactionOverview";
import AddLiquidityTransactionOverview from "@/components/modal/AddLiquidityTransactionOverview";
import SelectAsset from "@/components/modal/SelectAsset";
import ChainResult from "@/components/modal/ChainResult";
import {parseSui} from "../../utils/tools";
import TxToast from "@/components/ui/TxToast";
import toast from "react-hot-toast";
import coinInfo from "@/data/coin";
import config from "@/data/config";
import {SuiPriceServiceConnection} from "@pythnetwork/pyth-sui-js";


export default function Swap() {


    const wallet = useWallet();
    const {account, signAndExecuteTransactionBlock} = useWallet();
    const {error, loading, balance} = useAccountBalance();
    const [inputXAmount, setInputXAmount] = useState(0);
    const [inputYAmount, setInputYAmount] = useState(0);
    const [selectTokenX, setSelectTokenX] = useState("");
    const [selectTokenY, setSelectTokenY] = useState("");
    const [selectAction, setSelectAction] = useState("SWAP");
    const [selectTokenAsset, setSelectTokenAsset] = useState("");
    const [allExchanges, setAllExchanges] = useState([]);
    const [selectTokenXBalance, setSelectTokenXBalance] = useState([]);
    const [selectTokenYBalance, setSelectTokenYBalance] = useState([]);
    const [swapType, setSwapType] = useState('');
    const [swapRate, setSwapRate] = useState(0);
    const [slippage, setSlippage] = useState(0.5);
    const [yreserve, setYreserve] = useState(0);
    const [suiPrice, setSuiPrice] = useState(0);
    const [inputTokenXPrice, setInputTokenXPrice] = useState(0);
    const [inputTokenYPrice, setInputTokenYPrice] = useState(0);
    const [resultHash, setResultHash] = useState('');
    const [currentChain, setCurrentChain] = useState("sui:testnet");
    const [isLoading, setIsLoading] = useState(false);
    const [outputIsLoading, setOutputIsLoading] = useState(false);


    useEffect(() => {
        // console.log('account.chains', wallet,account,wallet.address)
        initData()
    }, []);
    useEffect(() => {
        if (wallet.account !== undefined) {
            console.log('wallet', wallet)
            if (wallet.account.chains[0] === "sui:unknown") {
                setCurrentChain('m2')
                initData('m2')
            } else {
                setCurrentChain(wallet.account.chains[0])
                initData(wallet.account.chains[0])
            }
        }
    }, [wallet]);

    async function initData(_currentChain) {
        setAllExchanges((await getAllExchanges(_currentChain)).data);

        const connection = new SuiPriceServiceConnection(
            "https://hermes.pyth.network"
        );
        const priceIds = [
            "0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744",
        ];
        const priceFeeds = await connection.getLatestPriceFeeds(priceIds);
        setSuiPrice((priceFeeds[0].getPriceNoOlderThan(60).price / (10 ** 8)).toFixed(2))
    }

    const handleXAmountChange = async (e) => {
        setInputXAmount(e.target.value)

        if (selectTokenX === '' || selectTokenY === "") {
            return
        }
        queryPairAndAmountOut(parseInt(e.target.value * (10 ** coinInfo[currentChain][selectTokenX].decimals)), selectTokenX, selectTokenY, slippage)
        // arrangeCollectionsByTradingPair()
    };

    async function queryPair(tokenX, tokenY) {
        const {tokenPairs, swapType: _swapType} = queryTokenPairs(tokenX, tokenY)
        if (tokenPairs === '') {
            setInputYAmount(0)
            return {}
        }
        // const client = new SuiClient({
        //     url: getFullnodeUrl('testnet'),
        // });
        //
        // console.log('config[currentChain + "Url"]', config[currentChain + "Url"])
        const client = new SuiClient({
            url: currentChain === 'm2' ? config[currentChain + "Url"] : getFullnodeUrl(config[currentChain + "Url"]),
        });
        const txn = await client.getObject({
            id: tokenPairs,
            // fetch the object content field
            options: {showContent: true},
        });
        return {txn, _swapType}
    }

    async function queryPairAndAmountOut(_amountValue, tokenX, tokenY, _slippage) {

        setOutputIsLoading(true)
        const {txn, _swapType} = await queryPair(tokenX, tokenY)
        if (txn === undefined) {
            return
        }
        setSwapType(_swapType)
        console.log('handleXAmountChange', txn)
        // console.log("txn", txn)
        // console.log("txn", txn.data.content.fields.x_reserve)
        let amountOut;
        if (selectAction === 'SWAP') {
            if (swapType === 'swap_x' || _swapType === 'swap_x') {
                amountOut = await calculateSwapAmountOut(txn.data.content.fields.x_reserve, txn.data.content.fields.y_reserve, _amountValue, currentChain);
                setSwapRate(txn.data.content.fields.x_reserve / txn.data.content.fields.y_reserve)
                setYreserve(txn.data.content.fields.y_reserve)
            } else {
                amountOut = await calculateSwapAmountOut(txn.data.content.fields.y_reserve, txn.data.content.fields.x_reserve, _amountValue, currentChain);
                setSwapRate(txn.data.content.fields.y_reserve / txn.data.content.fields.x_reserve)
                setYreserve(txn.data.content.fields.x_reserve)
            }
            const result = (amountOut.data * (1 - _slippage * 0.01)) / (10 ** coinInfo[currentChain][tokenY].decimals)
            console.log('resultresult', result)
            setInputYAmount(result === undefined ? 0 : result.toFixed(2))
        } else if (selectAction === 'ADDLIQUIDITY') {
            if (swapType === 'swap_x') {
                amountOut = Math.floor(_amountValue / (txn.data.content.fields.x_reserve / txn.data.content.fields.y_reserve))
            } else {
                amountOut = Math.floor(txn.data.content.fields.x_reserve / txn.data.content.fields.y_reserve * _amountValue)
            }
            // console.log('amountOut', amountOut)
            setInputYAmount(amountOut / (10 ** coinInfo[currentChain][tokenY].decimals))
        }
        setOutputIsLoading(false)
    }

    const handleYAmountChange = async (e) => {
        setInputYAmount(e.target.value)
    };

    const handleSlippageChange = async (e) => {
        setSlippage(e.target.value)
        queryPairAndAmountOut(inputXAmount * (10 ** coinInfo[currentChain][selectTokenX].decimals), selectTokenX, selectTokenY, e.target.value)
    };

    function queryBalanceObj(tokenBalance, inputAmount, XorY) {
        // console.log('tokenBalance', tokenBalance, inputAmount)
        for (const item of tokenBalance) {
            if (XorY === 'Y') {
                return item
            }
            if (parseInt(item.balance) > inputAmount) {
                // console.log('item', item)
                return item
            }
        }
        return ""
    }

    function queryTokenPairs(tokenX, tokenY) {
        let tokenPairs = ''
        for (const item of allExchanges) {
            let tempTokenX = item.x_TokenTypes[0]
            if (item.x_TokenTypes[0].indexOf("sui") === -1 && !item.x_TokenTypes[0].startsWith("0x")) {
                tempTokenX = '0x' + item.x_TokenTypes[0]
            }
            let tempTokenY = item.y_TokenTypes[0]
            if (item.y_TokenTypes[0].indexOf("sui") === -1 && !item.y_TokenTypes[0].startsWith("0x")) {
                tempTokenY = '0x' + item.y_TokenTypes[0]
            }

            if (tempTokenX === tokenX && tempTokenY === tokenY) {
                tokenPairs = item.tokenPairs[0]
                return {tokenPairs, swapType: 'swap_x'}
            } else if (tempTokenX === tokenY && tempTokenY === tokenX) {
                tokenPairs = item.tokenPairs[0]
                return {tokenPairs: tokenPairs, swapType: 'swap_y'}
            }
        }
        return {tokenPairs: '', swapType: ''}
    }

    function doAction() {
        if (inputXAmount === '' || inputXAmount === 0) {
            toast.custom(<TxToast title="please select token" digest={""}/>);
            return
        }
        if (inputYAmount === '' || inputYAmount === 0) {
            toast.custom(<TxToast title="please select token" digest={""}/>);
            return
        }
        if (selectTokenX === '') {
            toast.custom(<TxToast title="please select token" digest={""}/>);
            return
        }
        if (selectTokenY === '') {
            toast.custom(<TxToast title="please select token" digest={""}/>);
            return
        }
        const {tokenPairs, swapType} = queryTokenPairs(selectTokenX, selectTokenY)
        setSwapType(swapType)
        if (tokenPairs === '') {
            toast.custom(<TxToast title="don't have pool" digest={""}/>);
            return;
        }
        let XAmount = parseInt(inputXAmount * (10 ** coinInfo[currentChain][selectTokenX].decimals))
        let YAmount = parseInt(inputYAmount * (10 ** coinInfo[currentChain][selectTokenY].decimals))
        if (selectAction === 'SWAP') {
            swap(tokenPairs, swapType, XAmount, YAmount)
        } else if (selectAction === 'ADDLIQUIDITY') {
            addLiquidity(tokenPairs, XAmount, YAmount)
        }
    }

    function doSplitXCoin(txb, XAmount, YAmount) {
        let splitXCoin = ''
        if (selectTokenX === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI') {
            splitXCoin = txb.splitCoins(txb.gas, [txb.pure(XAmount)]);
            return splitXCoin
        } else {
            const tempBalanceObj = queryBalanceObj(selectTokenXBalance, XAmount, "X")
            if (tempBalanceObj !== '') {
                splitXCoin = tempBalanceObj.coinObjectId
            } else {
            }
        }
        return splitXCoin;
    }

    async function doSplitYCoin(txb, XAmount, YAmount) {
        console.log('selectTokenY', selectTokenY)
        let splitYCoin = ''
        if (selectTokenY === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI') {
            splitYCoin = txb.splitCoins(txb.gas, [txb.pure(YAmount)]);
        } else {
            const tempBalanceObj = queryBalanceObj(selectTokenYBalance, YAmount, 'Y')
            if (tempBalanceObj !== '') {
                splitYCoin = tempBalanceObj.coinObjectId
            } else {
                // 创建个0 objectid
                // '0x71ec440c694153474dd2a9c5c19cf60e2968d1af51aacfa24e34ee96a2df44dd::example_coin::EXAMPLE_COIN'
                await zero(selectTokenY, txb)
                // await selectToken(selectTokenY)
                let flag = true
                while (flag) {
                    const result = await getCoins(selectTokenY)
                    if (result !== undefined && result !== null && result[0] !== undefined) {
                        splitYCoin = result[0].coinObjectId
                        flag = false
                    }else {
                        await new Promise(r => setTimeout(r, 500));
                    }
                }
                // splitYCoin = doSplitYCoin(txb, XAmount, YAmount)
            }
        }
        return splitYCoin;
    }


    // async function zero() {
    //     try {
    //         const txb = new TransactionBlock();
    //         const resultObjectId =txb.moveCall({
    //             target: `0x2::coin::zero`,
    //             arguments: [],
    //             typeArguments: ['0x71ec440c694153474dd2a9c5c19cf60e2968d1af51aacfa24e34ee96a2df44dd::example_coin::EXAMPLE_COIN']
    //         });
    //         console.log('moveCallresult', resultObjectId)
    //         txb.transferObjects([resultObjectId], txb.pure.address(account.address))
    //         const res = await signAndExecuteTransactionBlock({
    //             transactionBlock: txb,
    //         });
    //         console.log('chain result', res)
    //         setResultHash(res.digest)
    //         // document.getElementById('transaction_overview_modal').close()
    //         // document.getElementById('my_modal_2').showModal()
    //
    //         // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
    //     } catch (error) {
    //         console.log('swap error', error)
    //         // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
    //         // toast.error(`Failed to add token to sell pool: ${error.message}.`);
    //     }
    // }

    async function zero(typeArg, txb) {
        console.log('selectTokenY', typeArg)
        try {
            const txb2 = new TransactionBlock();
            const resultObjectId = txb2.moveCall({
                target: `0x2::coin::zero`,
                arguments: [],
                typeArguments: [typeArg]
            });
            console.log('moveCallresult', resultObjectId)
            txb2.transferObjects([resultObjectId], txb2.pure.address(account.address))
            const res = await signAndExecuteTransactionBlock({
                transactionBlock: txb2,
            });
            console.log('res', res, resultObjectId, txb2)
            return resultObjectId

            // console.log('chain result', res)
            // setResultHash(res.digest)
            // document.getElementById('transaction_overview_modal').close()
            // document.getElementById('my_modal_2').showModal()

            // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
        } catch (error) {
            console.log('swap error', error)
            // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
            // toast.error(`Failed to add token to sell pool: ${error.message}.`);
        }
    }

    async function swap(tokenPairs, swapType, XAmount, YAmount) {
        try {
            console.log('wallet.account', wallet.account)
            const txb = new TransactionBlock();
            txb.setGasBudget(100000000);
            const splitXCoin = doSplitXCoin(txb, XAmount, YAmount)
            const splitYCoin = await doSplitYCoin(txb, XAmount, YAmount)
            let param = [
                txb.object(tokenPairs),
                txb.object(splitXCoin),
                txb.pure.u64(XAmount),
                txb.object(splitYCoin),
                txb.pure.u64(YAmount),
            ]
            console.log('param', param, COIN_TYPE)
            txb.moveCall({
                target: `${config[currentChain + "CORE_PACKAGE_ID"]}::token_pair_service::${swapType}`,
                arguments: param,
                typeArguments: [COIN_TYPE, `${config[currentChain + "CORE_PACKAGE_ID_NOT_OX"]}::example_coin::EXAMPLE_COIN`]
            });
            if (selectTokenY === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI') {
                txb.transferObjects([splitYCoin], txb.pure.address(account.address))
            }
            const res = await signAndExecuteTransactionBlock({
                transactionBlock: txb,
            });
            console.log('chain result', res)
            setResultHash(res.digest)
            document.getElementById('transaction_overview_modal').close()
            document.getElementById('my_modal_2').showModal()

            // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
        } catch (error) {
            console.log('swap error', error)
            // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
            // toast.error(`Failed to add token to sell pool: ${error.message}.`);
        }
    }


    // async function addLiquidity() {
    //     try {
    //         const txb = new TransactionBlock();
    //         txb.setGasBudget(100000000);
    //         const [xCoin] = txb.splitCoins(txb.gas, [txb.pure(3)]);
    //         let param = [
    //             txb.object('0x32295beac0c29ba32bd35cb38d8ef9984f474ce91b21bfd0945a9a7186f9fd9c'),
    //             txb.object(xCoin),
    //             txb.pure.u64(3),
    //             txb.object('0xdb5f2eeb2df17cb6ff6ed2c9317130606a074978b6eaf82d9700d2d3fbd447f6'),
    //             txb.pure.u64(2),
    //             txb.pure([])
    //         ]
    //         console.log('param', param, COIN_TYPE)
    //         txb.moveCall({
    //             target: `0x7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::token_pair_service::add_liquidity`,
    //             arguments: param,
    //             typeArguments: [COIN_TYPE, "7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::example_coin::EXAMPLE_COIN"]
    //         });
    //
    //         const res = await signAndExecuteTransactionBlock({
    //             transactionBlock: txb,
    //         });
    //         console.log('chain result', res)
    //
    //         // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
    //     } catch (error) {
    //         console.log('swap error', error)
    //         // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
    //         // toast.error(`Failed to add token to sell pool: ${error.message}.`);
    //     }
    //
    // }


    async function addLiquidity(tokenPairs, XAmount, YAmount) {
        try {
            const txb = new TransactionBlock();
            txb.setGasBudget(100000000);
            const splitXCoin = doSplitXCoin(txb, XAmount, YAmount)
            const splitYCoin = await doSplitYCoin(txb, XAmount, YAmount)
            let param = ''
            if (swapType === 'swap_x') {
                param = [
                    txb.object(tokenPairs),
                    txb.object(splitXCoin),
                    txb.pure.u64(XAmount),
                    txb.object(splitYCoin),
                    txb.pure.u64(YAmount),
                    txb.pure([])
                ]
            } else {
                param = [
                    txb.object(tokenPairs),
                    txb.object(splitYCoin),
                    txb.pure.u64(YAmount),
                    txb.object(splitXCoin),
                    txb.pure.u64(XAmount),
                    txb.pure([])
                ]
            }
            console.log('param', param, COIN_TYPE)
            txb.moveCall({
                target: `${config[currentChain + "CORE_PACKAGE_ID"]}::token_pair_service::add_liquidity`,
                arguments: param,
                typeArguments: [COIN_TYPE, `${config[currentChain + "CORE_PACKAGE_ID_NOT_OX"]}::example_coin::EXAMPLE_COIN`]
            });

            const res = await signAndExecuteTransactionBlock({
                transactionBlock: txb,
            });
            console.log('chain result', res)
            setResultHash(res.digest)
            document.getElementById('add_liquidity_transaction_overview_modal').close()
            document.getElementById('my_modal_2').showModal()

            // toast.custom(<TxToast title="Token added to sell pool successfully!" digest={res.digest} />);
        } catch (error) {
            console.log('swap error', error)
            // if (error.message.includes("Rejected from user")) return toast.error("You rejected the request in your wallet.");
            // toast.error(`Failed to add token to sell pool: ${error.message}.`);
        }
    }

    function closeLiquidityModal() {
        if (document.getElementById('add_liquidity_transaction_overview_modal') === null) {
            return
        }
        document.getElementById('add_liquidity_transaction_overview_modal').close()
    }

    function closeSwapModal() {
        if (document.getElementById('transaction_overview_modal') === null) {
            return
        }
        document.getElementById('transaction_overview_modal').close()
    }


    async function getCoins(coinAddress) {
        // const client = new SuiClient({
        //     url: getFullnodeUrl(account.chains[0].split(":")[1]),
        // });
        const client = new SuiClient({
            url: currentChain === 'm2' ? config[currentChain + "Url"] : getFullnodeUrl(config[currentChain + "Url"]),
        });

        const txn2 = await client.getCoins({
            owner: account.address,
            coinType: coinAddress
        });
        console.log('txn2', txn2)
        return txn2.data
    }

    async function handleActionChange(value) {
        setSelectAction(value);
    }

    function calculateBalance(tokenBalance, selectToken) {
        let balance = 0
        for (const item of tokenBalance) {
            balance = balance + parseInt(item.balance)
        }
        return (balance / (10 ** coinInfo[currentChain][selectToken].decimals)).toFixed(2)
    }

    function inputMaxAmount(tokenXOrY) {
        if (tokenXOrY === 'X') {
            if (selectTokenX === '') {
                return
            }
            const balanceX = calculateBalance(selectTokenXBalance, selectTokenX)
            setInputXAmount(balanceX)
            queryPairAndAmountOut(balanceX * (10 ** coinInfo[currentChain][selectTokenX].decimals), selectTokenX, selectTokenY, slippage)
        } else {
            if (selectTokenY === '') {
                return
            }
            const balanceY = calculateBalance(selectTokenYBalance, selectTokenY)
            setInputYAmount(balanceY)
        }
    }

    function openModal() {
        if (selectAction === 'SWAP') {
            document.getElementById('transaction_overview_modal').showModal()
        } else if (selectAction === 'ADDLIQUIDITY') {
            document.getElementById('add_liquidity_transaction_overview_modal').showModal()
        }
    }

    async function selectToken(tokenInfo) {
        setIsLoading(true)
        if (selectTokenAsset === 'tokenx') {
            setSelectTokenX(tokenInfo)
            const result = await getCoins(tokenInfo)
            setSelectTokenXBalance(result)
            if (selectTokenY !== '') {
                queryPairAndAmountOut(inputXAmount * (10 ** coinInfo[currentChain][tokenInfo].decimals), tokenInfo, selectTokenY, slippage)
            }
        } else {
            setSelectTokenY(tokenInfo)
            const result = await getCoins(tokenInfo)
            setSelectTokenYBalance(result)
            if (selectTokenX !== '') {
                // 只能从x到y,没有开发y到x的兑换量
                queryPairAndAmountOut(inputXAmount * (10 ** coinInfo[currentChain][tokenInfo].decimals), selectTokenX, tokenInfo, slippage)
            }
        }
        setIsLoading(false)
        document.getElementById('select_asset_modal').close()
    }

    function openAssetModal(token) {
        setSelectTokenAsset(token)
        document.getElementById('select_asset_modal').showModal()
    }

    async function calculateInputPrice(amount, selectToken, xOrY) {
        let result = 0
        if (selectToken === '') {
            result = 0
        } else if (selectToken === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI') {
            result = amount * suiPrice
        } else {
            const {txn, _swapType} = await queryPair('0000000000000000000000000000000000000000000000000000000000000002::sui::SUI', selectToken)
            const amountOut = await calculateSwapAmountOut(txn.data.content.fields.y_reserve, txn.data.content.fields.x_reserve, amount * (10 ** coinInfo[currentChain][selectToken].decimals), currentChain);
            // await queryPairAndAmountOut(1000000000, '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI', selectToken, 0)
            console.log('resultresult', amountOut.data)
            result = amountOut.data / (10 ** 9) * suiPrice
        }
        if (xOrY === 'X') {
            setInputTokenXPrice(result.toFixed(2))
        } else {
            setInputTokenYPrice(result.toFixed(2))
        }
    }

    useEffect(() => {
        calculateInputPrice(inputXAmount, selectTokenX, 'X')
    }, [selectTokenX, inputXAmount]);

    useEffect(() => {
        calculateInputPrice(inputYAmount, selectTokenY, 'Y')
    }, [selectTokenY, inputYAmount]);

    return (
        <>
            <div className="relative flex flex-col justify-center items-center gap-8 py-16 text-[#030201]">
                <div className="font-[700] w-[60%] font-['twkemono-bold']">
                    <h1 className="lg:text-4xl text-2xl goldman-bold text-[3rem] text-left">Swap Anything</h1>
                    <h1 className="lg:text-4xl text-2xl goldman-bold text-right">anytime anywhere</h1>
                </div>
                <div className="flex">
                    <div>
                        <div>
                            <div className="dropdown dropdown-hover bg-[#fbf2c4] rounded-[1rem]">
                                <div tabIndex={0} role="button" className="text-[1rem] font-[700] mx-[1.5rem] mt-[0.5rem] bg-[#fbf2c4] flex flex-col justify-center items-center w-[10rem]">
                                    <div className="mb-[1rem] mt-[0.5rem] font-['twkemono-bold']">{selectAction === 'ADDLIQUIDITY' ? 'ADD LIQUIDITY' : selectAction}</div>
                                    <Image alt='' className="mb-[1rem]" src="/downbold.svg" width={20} height={20}></Image>
                                </div>
                                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 bg-[#fbf2c4]">
                                    <li onClick={() => handleActionChange('SWAP')}><a>SWAP</a></li>
                                    <li onClick={() => handleActionChange('ADDLIQUIDITY')}><a>ADD LIQUIDITY</a></li>
                                    <li onClick={() => handleActionChange('CREATE')}><a>CREATE</a></li>
                                </ul>
                            </div>

                        </div>
                        <div></div>
                    </div>
                    <div className=" bg-[#fbf2c4] rounded-[1rem] mx-[1rem]">
                        <div className="flex items-center">
                            <div className="pl-[1rem] py-[0.5rem]">
                                <div className="mb-[0.25rem]  font-[400]">{selectAction === 'SWAP' ? 'You pay' : 'Select Asset'}</div>
                                <div className="flex items-center bg-[#323232] rounded-[0.5rem] py-[0.25rem] px-[1rem]">
                                    <input onChange={handleXAmountChange} value={inputXAmount} type="text" className="mr-[0.5rem] bg-[#323232] text-white focus:outline-none" placeholder="Asset"/>
                                    {/*<span className="text-white mr-[50px]">Asset</span>*/}
                                    <div onClick={() => openAssetModal('tokenx')} className="text-white bg-[#808080] py-[10px] rounded-[0.5rem] px-[8px] flex items-center cursor-pointer w-[10rem]">
                                        <span className="mr-[0.25rem]">{selectTokenX === '' ? 'Select Token' : selectTokenX.split("::")[2]}</span>
                                        <Image alt='' src="/down.svg" width={20} height={20}></Image>
                                    </div>
                                    <button className="btn text-white bg-[#0337ffcc] border-none ml-[0.25rem]" onClick={() => inputMaxAmount('X')}>Max</button>
                                </div>
                                <div className="flex justify-between text-[0.55rem] text-[#808080] mt-[0.5rem]">
                                    <span>{'$ ' + inputTokenXPrice}</span><span>Balance:{calculateBalance(selectTokenXBalance, selectTokenX)}</span>
                                </div>
                            </div>
                            <div className="mx-[2rem]">
                                {selectAction === 'SWAP' ? <Image alt='' src="/toright.svg" width={100} height={50}></Image> : <Image src="/PlusPair.svg" width={100} height={50}></Image>}
                            </div>
                            <div className="pl-[1rem] py-[0.5rem] mr-[1rem]">
                                <div className="mb-[0.25rem]  font-[400] flex">
                                    {selectAction === 'SWAP' ? 'You Receive' : 'Select Asset'}
                                    {outputIsLoading&&<span className="ml-3 loading loading-spinner loading-sm color-white"></span>}
                                </div>
                                <div className="flex items-center bg-[#323232] rounded-[0.5rem] py-[0.25rem] px-[1rem]">
                                    <input type="text" className="mr-[0.5rem]  bg-[#323232] text-white focus:outline-none" onChange={handleYAmountChange} value={inputYAmount} placeholder="Asset"/>
                                    <div onClick={() => openAssetModal('tokeny')} className="text-white bg-[#808080] py-[10px] rounded-[0.5rem] px-[8px] flex items-center cursor-pointer w-[10rem]">
                                        <span className="mr-[0.25rem]">{selectTokenY === '' ? 'Select Token' : selectTokenY.split("::")[2]}</span>
                                        <Image alt='' src="/down.svg" width={20} height={20}></Image>
                                    </div>
                                    <button className="btn text-white bg-[#0337ffcc] border-none ml-[0.25rem]" onClick={() => inputMaxAmount('Y')}>Max</button>
                                </div>
                                <div className="flex justify-between text-[0.55rem] text-[#808080] mt-[0.5rem]">
                                    <span>{'$ ' + inputTokenYPrice}</span><span>Balance:{calculateBalance(selectTokenYBalance, selectTokenY)}</span>
                                </div>
                            </div>
                        </div>

                        {selectAction === 'SWAP' && <div className="flex flex-col items-end	mt-[0.25rem] px-[1rem]">
                            <div className="bg-[#323232] text-white rounded-[1rem] py-[0.25rem]">
                                <input className="bg-[#323232] rounded-l-[1rem] pl-[1rem] w-[5rem]" onChange={handleSlippageChange} value={slippage} type="text"/>
                                <span className="pr-[1rem]">% Slippage</span>
                            </div>
                            <div className="text-[#0337FFCC] text-[0.5rem] mr-[1rem] mt-[0.2rem] mb-[0.5rem]">
                                0.5% Recommended
                            </div>
                        </div>}
                    </div>
                    <button className="btn bg-[#3556D5] border-none text-white" onClick={() => openModal()}>Preview</button>
                    <ChainResult title={selectAction === 'SWAP' ? "Swap submitted" : selectAction === 'ADDLIQUIDITY' ? "Add liquidity submitted" : "Create pool submitted"} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]} resultHash={resultHash} currentChain={currentChain}/>
                    <TransactionOverview handleClick={doAction} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]} slippage={slippage} impact={(inputYAmount * (10 ** coinInfo[currentChain][selectTokenY].decimals) / yreserve * 100).toFixed(2)} inputTokenXPrice={inputTokenXPrice} inputTokenYPrice={inputTokenYPrice}
                                         tokenXBalance={calculateBalance(selectTokenXBalance, selectTokenX)}
                                         tokenYBalance={calculateBalance(selectTokenYBalance, selectTokenY)} closeClick={closeSwapModal}/>
                    <AddLiquidityTransactionOverview handleClick={doAction} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]} swapRate={swapRate} inputTokenXPrice={inputTokenXPrice} inputTokenYPrice={inputTokenYPrice} tokenXBalance={calculateBalance(selectTokenXBalance, selectTokenX)} tokenYBalance={calculateBalance(selectTokenYBalance, selectTokenY)}
                                                     closeClick={closeLiquidityModal}/>
                    <SelectAsset handleClick={selectToken} currentChain={currentChain} isLoading={isLoading}/>
                </div>
            </div>
        </>
    );
}
