"use client";

import Image from "next/image";
import {useAccountBalance, useSuiProvider, useWallet} from "@suiet/wallet-kit";
import {useEffect, useState} from "react";
import {getFullnodeUrl, SuiClient} from '@mysten/sui.js/client';
import {getAllExchanges} from "@/actions/ftassets.action";
import {calculateSwapAmountOut} from "../../actions/ftassets.action";
import {TransactionBlock} from "@mysten/sui.js/transactions";
import {COIN_TYPE} from "../../constant";
import ChainResult from "@/components/modal/ChainResult";
import TransactionOverview from "@/components/modal/TransactionOverview";
import AddLiquidityTransactionOverview from "@/components/modal/AddLiquidityTransactionOverview";
import SelectAsset from "@/components/modal/SelectAsset";
import {parseSui} from "../../utils/tools";
import TxToast from "@/components/ui/TxToast";
import toast from "react-hot-toast";

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


    useEffect(() => {
        initData()
    }, []);

    async function initData() {
        setAllExchanges((await getAllExchanges()).data);
        // console.log('allExchanges', allExchanges)
        // console.log('allExchanges', allExchanges)
        // console.log('wallet status22222', balance)
        // console.log('connected account info', wallet.account)
    }

    const handleXAmountChange = async (e) => {
        setInputXAmount(e.target.value)
        const client = new SuiClient({
            url: getFullnodeUrl('testnet'),
        });
        const txn = await client.getObject({
            id: '0x32295beac0c29ba32bd35cb38d8ef9984f474ce91b21bfd0945a9a7186f9fd9c',
            // fetch the object content field
            options: {showContent: true},
        });
        // console.log("txn", txn)
        // console.log("txn", txn.data.content.fields.x_reserve)
        const {data: amountOut} = await calculateSwapAmountOut(txn.data.content.fields.x_reserve, txn.data.content.fields.y_reserve, e.target.value);
        // console.log('amountOut', amountOut)
        setInputYAmount(amountOut)

        // arrangeCollectionsByTradingPair()
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
        let tokenPairs = ''
        for (const item of allExchanges) {
            let tempTokenX= item.x_TokenTypes[0]
            if (item.x_TokenTypes[0].indexOf("sui")===-1 && !item.x_TokenTypes[0].startsWith("0x")){
                tempTokenX= '0x'+item.x_TokenTypes[0]
            }
            let tempTokenY= item.y_TokenTypes[0]
            if (item.y_TokenTypes[0].indexOf("sui")===-1 && !item.y_TokenTypes[0].startsWith("0x")){
                tempTokenY= '0x'+item.y_TokenTypes[0]
            }

            if (tempTokenX === selectTokenX && tempTokenY === selectTokenY) {
                tokenPairs = item.tokenPairs[0]
                break
            } else if (tempTokenX === selectTokenY && tempTokenY === selectTokenX) {
                tokenPairs = item.tokenPairs[0]
                break
            }
        }
        if (tokenPairs === ''){
            toast.custom(<TxToast title="don't have pool" digest={""}/>);
            return;
        }

        if (selectAction === 'SWAP') {
            swap(tokenPairs)
        } else if (selectAction === 'ADDLIQUIDITY') {
            addLiquidity(tokenPairs)
        }
    }

    function doSplitXCoin(txb) {
        let splitXCoin = ''
        if (selectTokenX === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI') {
            splitXCoin = txb.splitCoins(txb.gas, [txb.pure(inputXAmount)]);
        } else {
            const tempBalanceObj = queryBalanceObj(selectTokenXBalance, inputXAmount)
            if (tempBalanceObj !== '') {
                splitXCoin = tempBalanceObj.coinObjectId
            } else {
                // todo 合并或报错
            }
        }
        return splitXCoin;
    }

    function doSplitYCoin(txb) {
        let splitYCoin = ''
        if (selectTokenY === '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI') {
            splitYCoin = txb.splitCoins(txb.gas, [txb.pure(inputYAmount)]);
        } else {
            const tempBalanceObj = queryBalanceObj(selectTokenYBalance, inputYAmount)
            if (tempBalanceObj !== '') {
                splitYCoin = tempBalanceObj.coinObjectId
            } else {
                // todo 合并或报错
            }
        }
        return splitYCoin;
    }

    async function swap(tokenPairs) {
        try {
            const txb = new TransactionBlock();
            txb.setGasBudget(100000000);
            const splitXCoin = doSplitXCoin(txb)
            const splitYCoin = doSplitYCoin(txb)
            let param = [
                txb.object(tokenPairs),
                txb.object(splitXCoin),
                txb.pure.u64(inputXAmount),
                txb.object(splitYCoin),
                txb.pure.u64(inputYAmount),
            ]
            console.log('param', param, COIN_TYPE)
            // txb.setGasBudget(10000);
            txb.moveCall({
                target: `0x7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::token_pair_service::swap_x`,
                arguments: param,
                typeArguments: [COIN_TYPE, "7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::example_coin::EXAMPLE_COIN"]
            });

            const res = await signAndExecuteTransactionBlock({
                transactionBlock: txb,
            });
            console.log('chain result', res)
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


    async function addLiquidity(tokenPairs) {
        try {
            const txb = new TransactionBlock();
            txb.setGasBudget(100000000);
            // const [xCoin] = txb.splitCoins(txb.gas, [txb.pure(3)]);
            const splitXCoin = doSplitXCoin(txb)
            const splitYCoin = doSplitYCoin(txb)
            let param = [
                txb.object(tokenPairs),
                txb.object(splitXCoin),
                txb.pure.u64(inputXAmount),
                txb.object(splitYCoin),
                txb.pure.u64(inputYAmount),
                txb.pure([])
            ]
            console.log('param', param, COIN_TYPE)
            txb.moveCall({
                target: `0x7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::token_pair_service::add_liquidity`,
                arguments: param,
                typeArguments: [COIN_TYPE, "7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::example_coin::EXAMPLE_COIN"]
            });

            const res = await signAndExecuteTransactionBlock({
                transactionBlock: txb,
            });
            console.log('chain result', res)

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
            // fetch the object content field
        });
        return txn2.data
        // console.log('txn2', txn2.data)
    }

    async function handleTokenXChange(event) {
        // console.log('account', account.address)
        // console.log('account', account.chains[0].split(":")[1])
        // console.log(event.target.value)
        setSelectTokenX(event.target.value);
        const result = await getCoins(event.target.value)
        console.log('result', result)
        setSelectTokenXBalance(result)
    }

    async function handleTokenYChange(event) {
        setSelectTokenY(event.target.value);
        const result = await getCoins(event.target.value)
        setSelectTokenYBalance(result)
    }

    async function handleActionChange(event) {
        setSelectAction(event.target.value);
    }

    function calculateBalance(tokenBalance) {
        let balance = 0
        for (const item of tokenBalance) {
            balance = balance + parseInt(item.balance)
        }
        return balance
    }

    function inputMaxAmount(tokenXOrY) {
        if (tokenXOrY === 'X') {
            setInputXAmount(calculateBalance(selectTokenXBalance))
        } else {
            setInputYAmount(calculateBalance(selectTokenYBalance))

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
            console.log('result', result)
            setSelectTokenXBalance(result)
        } else {
            setSelectTokenY(tokenInfo)
            const result = await getCoins(tokenInfo)
            setSelectTokenYBalance(result)
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
                {/*{JSON.stringify(objects)}*/}
                <div className="font-[700] w-[60%] font-['twkemono-bold']">
                    <h1 className="lg:text-4xl text-2xl goldman-bold text-[3rem] text-left">Swap Anything</h1>
                    <h1 className="lg:text-4xl text-2xl goldman-bold text-right">anytime anywhere</h1>
                </div>
                <div className="flex">
                    <div>
                        <div>
                            <select value={selectAction} onChange={handleActionChange} className="select select-bordered w-full max-w-xs font-[700] rounded-[1rem] shadow-gray-50	bg-[#fbf2c4]">
                                <option defaultValue={"SWAP"} value="SWAP">SWAP</option>
                                <option value="ADDLIQUIDITY">ADD LIQUIDITY</option>
                                <option value="CREATE">CREATE</option>
                            </select>
                        </div>
                        <div></div>
                    </div>
                    <div className=" flex items-center  rounded-[1rem] mx-[1rem] bg-[#fbf2c4]">
                        <div className="pl-[1rem] py-[0.5rem]">
                            <div className="mb-[0.25rem]  font-[400]">You pay</div>
                            <div className="flex items-center bg-[#323232] rounded-[0.5rem] py-[0.25rem] px-[1rem]">
                                <input onChange={handleXAmountChange} value={inputXAmount} type="text" className="mr-[0.5rem] bg-[#323232] text-white focus:outline-none" placeholder="Asset"/>
                                {/*<span className="text-white mr-[50px]">Asset</span>*/}
                                <div onClick={() => openAssetModal('tokenx')} className="text-white bg-[#808080] py-[10px] rounded-[0.5rem] px-[8px] flex items-center">
                                    <span className="mr-[0.25rem]">{selectTokenX === '' ? 'Select Token' : selectTokenX.split("::")[2]}</span>
                                    <Image src="/down.svg" width={20} height={20}></Image>
                                </div>
                                {/*<select className="select select-bordered w-full max-w-xs" value={selectTokenX} onChange={handleTokenXChange}>*/}
                                {/*    <option value="" selected>Select Token</option>*/}
                                {/*    <option value="0000000000000000000000000000000000000000000000000000000000000002::sui::SUI">SUI</option>*/}
                                {/*    <option value="0x7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::example_coin::EXAMPLE_COIN">EXAMPLE_COIN</option>*/}
                                {/*</select>*/}
                                <button className="btn text-white bg-[#0337ffcc] border-none ml-[0.25rem]" onClick={() => inputMaxAmount('X')}>Max</button>
                            </div>
                            <div className="flex justify-between text-[0.5rem] text-[#808080] mt-[0.5rem]">
                                <span>$0</span><span>Balance:{calculateBalance(selectTokenXBalance)}</span>
                            </div>
                        </div>
                        <div className="mx-[2rem]">
                            <Image src="/toright.svg" width={100} height={50}></Image>
                        </div>
                        <div className="pl-[1rem] py-[0.5rem] mr-[1rem]">
                            <div className="mb-[0.25rem]  font-[400]">You Receive</div>
                            <div className="flex items-center bg-[#323232] rounded-[0.5rem] py-[0.25rem] px-[1rem]">
                                <input type="text" className="mr-[0.5rem]  bg-[#323232] text-white focus:outline-none" value={inputYAmount} placeholder="Asset"/>
                                {/*<select className="select select-bordered w-full max-w-xs" value={selectTokenY} onChange={handleTokenYChange}>*/}
                                {/*    <option value="" selected>Select Token</option>*/}
                                {/*    <option value="0x7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::example_coin::EXAMPLE_COIN">EXAMPLE_COIN</option>*/}
                                {/*    <option value="0000000000000000000000000000000000000000000000000000000000000002::sui::SUI">SUI</option>*/}
                                {/*</select>*/}
                                <div onClick={() => openAssetModal('tokeny')} className="text-white bg-[#808080] py-[10px] rounded-[0.5rem] px-[8px] flex items-center">
                                    <span className="mr-[0.25rem]">{selectTokenY === '' ? 'Select Token' : selectTokenY.split("::")[2]}</span>
                                    <Image src="/down.svg" width={20} height={20}></Image>
                                </div>
                                <button className="btn text-white bg-[#0337ffcc] border-none ml-[0.25rem]" onClick={() => inputMaxAmount('Y')}>Max</button>
                            </div>
                            <div className="flex justify-between text-[0.5rem] text-[#808080] mt-[0.5rem]">
                                <span>$0</span><span>Balance:{calculateBalance(selectTokenYBalance)}</span>
                            </div>
                        </div>
                    </div>
                    {/*<div>Preview</div>*/}
                    {/*onClick={() => doAction()}*/}
                    <button className="btn bg-[#3556D5] border-none text-white" onClick={() => openModal()}>Preview</button>
                    <ChainResult title={selectAction === 'SWAP' ? "Swap submitted" : selectAction === 'ADDLIQUIDITY' ? "Add liquidity submitted" : "Create pool submitted"} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]}/>
                    <TransactionOverview handleClick={doAction} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]}/>
                    <AddLiquidityTransactionOverview handleClick={doAction} inputX={inputXAmount} inputY={inputYAmount} inputXToken={selectTokenX === "" ? "" : selectTokenX.split("::")[2]} inputYToken={selectTokenY === "" ? "" : selectTokenY.split("::")[2]}/>
                    <SelectAsset handleClick={selectToken}/>
                    {/*<button onClick={()=>document.getElementById('my_modal_2').showModal()}>openResult</button> <br/>*/}
                    {/*<button onClick={()=>document.getElementById('transaction_overview_modal').showModal()}>openOver</button> <br/>*/}
                    {/*<button onClick={()=>document.getElementById('select_asset_modal').showModal()}>openselect_asset_modal</button>*/}
                </div>

            </div>

        </>
    );
}
