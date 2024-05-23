"use client";

import Image from "next/image";
import {useAccountBalance, useSuiProvider, useWallet} from "@suiet/wallet-kit";
import {useEffect, useState} from "react";
import {getFullnodeUrl, SuiClient} from '@mysten/sui.js/client';
import {getAllExchanges} from "@/actions/ftassets.action";
import {calculateSwapAmountOut} from "../../actions/ftassets.action";
import {TransactionBlock} from "@mysten/sui.js/transactions";
import {COIN_TYPE, CORE_PACKAGE_ID, CORE_PACKAGE_ID_NOT_OX} from "../../constant";
import TransactionOverview from "@/components/modal/TransactionOverview";
import AddLiquidityTransactionOverview from "@/components/modal/AddLiquidityTransactionOverview";
import SelectAsset from "@/components/modal/SelectAsset";
import ChainResult from "@/components/modal/ChainResult";
import {parseSui} from "../../utils/tools";
import TxToast from "@/components/ui/TxToast";
import toast from "react-hot-toast";
import coinInfo from "@/data/coin";

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
    const [resultHash, setResultHash] = useState('');


    useEffect(() => {
        initData()
    }, []);

    async function initData() {
        setAllExchanges((await getAllExchanges()).data);
    }

    const handleXAmountChange = async (e) => {
        setInputXAmount(e.target.value)

        if (selectTokenX === '' || selectTokenY === "") {
            return
        }
        queryPairAndAmountOut(parseInt(e.target.value * (10 ** coinInfo[selectTokenX].decimals)), selectTokenX, selectTokenY, slippage)
        // arrangeCollectionsByTradingPair()
    };

    async function queryPairAndAmountOut(_amountValue, tokenX, tokenY, _slippage) {
        const {tokenPairs, swapType: _swapType} = queryTokenPairs(tokenX, tokenY)
        if (tokenPairs === '') {
            setInputYAmount(0)
            return
        }
        const client = new SuiClient({
            url: getFullnodeUrl('testnet'),
        });
        const txn = await client.getObject({
            id: tokenPairs,
            // fetch the object content field
            options: {showContent: true},
        });
        console.log('handleXAmountChange', txn)
        // console.log("txn", txn)
        // console.log("txn", txn.data.content.fields.x_reserve)
        let amountOut;
        if (selectAction === 'SWAP') {
            if (swapType === 'swap_x' || _swapType === 'swap_x') {
                amountOut = await calculateSwapAmountOut(txn.data.content.fields.x_reserve, txn.data.content.fields.y_reserve, _amountValue);
                setSwapRate(txn.data.content.fields.x_reserve / txn.data.content.fields.y_reserve)
                setYreserve(txn.data.content.fields.y_reserve)
            } else {
                amountOut = await calculateSwapAmountOut(txn.data.content.fields.y_reserve, txn.data.content.fields.x_reserve, _amountValue);
                setSwapRate(txn.data.content.fields.y_reserve / txn.data.content.fields.x_reserve)
                setYreserve(txn.data.content.fields.x_reserve)
            }
            const result = (amountOut.data * (1 - _slippage * 0.01)) / (10 ** coinInfo[tokenY].decimals)
            console.log('resultresult', result)
            setInputYAmount(result === undefined ? 0 : result.toFixed(2))
        } else if (selectAction === 'ADDLIQUIDITY') {
            if (swapType === 'swap_x') {
                amountOut = Math.floor(_amountValue / (txn.data.content.fields.x_reserve / txn.data.content.fields.y_reserve))
            } else {
                amountOut = Math.floor(txn.data.content.fields.x_reserve / txn.data.content.fields.y_reserve * _amountValue)
            }
            // console.log('amountOut', amountOut)
            setInputYAmount(amountOut / (10 ** coinInfo[tokenY].decimals))
        }
    }

    const handleYAmountChange = async (e) => {
        setInputYAmount(e.target.value)
    };

    const handleSlippageChange = async (e) => {
        setSlippage(e.target.value)
        queryPairAndAmountOut(inputXAmount * (10 ** coinInfo[selectTokenX].decimals), selectTokenX, selectTokenY, e.target.value)
    };

    function queryBalanceObj(tokenBalance, inputAmount) {
        console.log('tokenBalance', tokenBalance, inputAmount)
        for (const item of tokenBalance) {
            if (parseInt(item.balance) > inputAmount) {
                console.log('item', item)
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
                setSwapType('swap_x')
                return {tokenPairs, swapType: 'swap_x'}
            } else if (tempTokenX === tokenY && tempTokenY === tokenX) {
                tokenPairs = item.tokenPairs[0]
                setSwapType('swap_y')
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
        if (tokenPairs === '') {
            toast.custom(<TxToast title="don't have pool" digest={""}/>);
            return;
        }
        let XAmount = parseInt(inputXAmount * (10 ** coinInfo[selectTokenX].decimals))
        let YAmount = parseInt(inputYAmount * (10 ** coinInfo[selectTokenY].decimals))
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
            const tempBalanceObj = queryBalanceObj(selectTokenXBalance, XAmount)
            if (tempBalanceObj !== '') {
                splitXCoin = tempBalanceObj.coinObjectId
            } else {
                // todo 合并或报错
            }
        }
        return splitXCoin;
    }

    function doSplitYCoin(txb, XAmount, YAmount) {
        let splitYCoin = ''
        if (selectTokenY === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI') {
            splitYCoin = txb.splitCoins(txb.gas, [txb.pure(YAmount)]);
        } else {
            const tempBalanceObj = queryBalanceObj(selectTokenYBalance, YAmount)
            if (tempBalanceObj !== '') {
                splitYCoin = tempBalanceObj.coinObjectId
            } else {
                // todo 合并或报错
            }
        }
        return splitYCoin;
    }

    async function swap(tokenPairs, swapType, XAmount, YAmount) {
        try {
            console.log('wallet.account', wallet.account)
            const txb = new TransactionBlock();
            txb.setGasBudget(100000000);
            const splitXCoin = doSplitXCoin(txb, XAmount, YAmount)
            const splitYCoin = doSplitYCoin(txb, XAmount, YAmount)
            let param = [
                txb.object(tokenPairs),
                txb.object(splitXCoin),
                txb.pure.u64(XAmount),
                txb.object(splitYCoin),
                txb.pure.u64(YAmount),
            ]
            console.log('param', param, COIN_TYPE)
            txb.moveCall({
                target: `${CORE_PACKAGE_ID}::token_pair_service::${swapType}`,
                arguments: param,
                typeArguments: [COIN_TYPE, `${CORE_PACKAGE_ID_NOT_OX}::example_coin::EXAMPLE_COIN`]
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
            const splitYCoin = doSplitYCoin(txb, XAmount, YAmount)
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
                target: `${CORE_PACKAGE_ID}::token_pair_service::add_liquidity`,
                arguments: param,
                typeArguments: [COIN_TYPE, `${CORE_PACKAGE_ID_NOT_OX}::example_coin::EXAMPLE_COIN`]
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


    async function getCoins(coinAddress) {
        const client = new SuiClient({
            url: getFullnodeUrl(account.chains[0].split(":")[1]),
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
        return balance / (10 ** coinInfo[selectToken].decimals)
    }

    function inputMaxAmount(tokenXOrY) {
        if (tokenXOrY === 'X') {
            if (selectTokenX === '') {
                return
            }
            const balanceX = calculateBalance(selectTokenXBalance, selectTokenX)
            setInputXAmount(balanceX)
            queryPairAndAmountOut(balanceX * (10 ** coinInfo[selectTokenX].decimals), selectTokenX, selectTokenY, slippage)
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
        if (selectTokenAsset === 'tokenx') {
            setSelectTokenX(tokenInfo)
            const result = await getCoins(tokenInfo)
            setSelectTokenXBalance(result)
            if (selectTokenY !== '') {
                queryPairAndAmountOut(inputXAmount * (10 ** coinInfo[tokenInfo].decimals), tokenInfo, selectTokenY, slippage)
            }
        } else {
            setSelectTokenY(tokenInfo)
            const result = await getCoins(tokenInfo)
            setSelectTokenYBalance(result)
            // queryTokenPairs(selectTokenX, tokenInfo)
            if (selectTokenX !== '') {
                // 只能从x到y,没有开发y到x的兑换量
                queryPairAndAmountOut(inputXAmount * (10 ** coinInfo[tokenInfo].decimals), selectTokenX, tokenInfo, slippage)
            }
        }
        document.getElementById('select_asset_modal').close()
    }

    function openAssetModal(token) {
        setSelectTokenAsset(token)
        document.getElementById('select_asset_modal').showModal()
    }


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
                                    <Image className="mb-[1rem]" src="/downbold.svg" width={20} height={20}></Image>
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
                                        <Image src="/down.svg" width={20} height={20}></Image>
                                    </div>
                                    <button className="btn text-white bg-[#0337ffcc] border-none ml-[0.25rem]" onClick={() => inputMaxAmount('X')}>Max</button>
                                </div>
                                <div className="flex justify-between text-[0.5rem] text-[#808080] mt-[0.5rem]">
                                    <span>$0</span><span>Balance:{calculateBalance(selectTokenXBalance, selectTokenX)}</span>
                                </div>
                            </div>
                            <div className="mx-[2rem]">
                                <Image src="/toright.svg" width={100} height={50}></Image>
                            </div>
                            <div className="pl-[1rem] py-[0.5rem] mr-[1rem]">
                                <div className="mb-[0.25rem]  font-[400]">{selectAction === 'SWAP' ? 'You Receive' : 'Select Asset'}</div>
                                <div className="flex items-center bg-[#323232] rounded-[0.5rem] py-[0.25rem] px-[1rem]">
                                    <input type="text" className="mr-[0.5rem]  bg-[#323232] text-white focus:outline-none" onChange={handleYAmountChange} value={inputYAmount} placeholder="Asset"/>
                                    <div onClick={() => openAssetModal('tokeny')} className="text-white bg-[#808080] py-[10px] rounded-[0.5rem] px-[8px] flex items-center cursor-pointer w-[10rem]">
                                        <span className="mr-[0.25rem]">{selectTokenY === '' ? 'Select Token' : selectTokenY.split("::")[2]}</span>
                                        <Image src="/down.svg" width={20} height={20}></Image>
                                    </div>
                                    <button className="btn text-white bg-[#0337ffcc] border-none ml-[0.25rem]" onClick={() => inputMaxAmount('Y')}>Max</button>
                                </div>
                                <div className="flex justify-between text-[0.5rem] text-[#808080] mt-[0.5rem]">
                                    <span>$0</span><span>Balance:{calculateBalance(selectTokenYBalance, selectTokenY)}</span>
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
                    <ChainResult title={selectAction === 'SWAP' ? "Swap submitted" : selectAction === 'ADDLIQUIDITY' ? "Add liquidity submitted" : "Create pool submitted"} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]} resultHash={resultHash}/>
                    <TransactionOverview handleClick={doAction} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]} slippage={slippage} impact={(inputYAmount * (10 ** coinInfo[selectTokenY].decimals) / yreserve * 100).toFixed(2)}/>
                    <AddLiquidityTransactionOverview handleClick={doAction} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]} swapRate={swapRate}/>
                    <SelectAsset handleClick={selectToken}/>
                </div>
            </div>
        </>
    );
}
