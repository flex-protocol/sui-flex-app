"use client";

import Image from "next/image";

export default function AddLiquidityTransactionOverview({handleClick, inputX,inputY,inputXToken,inputYToken,inputTokenXPrice,inputTokenYPrice,tokenXBalance,tokenYBalance,closeClick}) {

    return (
        <>
            <dialog id="add_liquidity_transaction_overview_modal" className="modal">
                <div className="modal-box">
                    <div className="flex items-center">
                        <Image onClick={closeClick} className="cursor-pointer" src="/close.svg" width={20} height={20}></Image>
                        <span className="ml-4">Transaction Overview</span></div>
                    <div className="mb-[0.5rem] mt-[1rem]">Pair Token 1</div>

                    <div className="flex justify-between text-[1rem]">
                        <div>{inputX}</div>
                        <div>{inputXToken}</div>
                    </div>
                    <div className="flex justify-between mt-[0.25rem] text-[0.5rem] text-[#808080]">
                        <div>${inputTokenXPrice}</div>
                        <div>Balance: {tokenXBalance}</div>
                    </div>
                    <div className="mt-[0.5rem]">
                        Pair Token 2
                    </div>
                    <div className="flex justify-between mt-[0.5rem]  text-[1rem]">
                        <div>{inputY}</div>
                        <div>{inputYToken}</div>
                    </div>
                    <div className="flex justify-between mt-[0.25rem] text-[0.5rem] text-[#808080]">
                        <div>${inputTokenYPrice}</div>
                        <div>Balance: {tokenYBalance}</div>
                    </div>

                    <div className="flex justify-between mt-[1rem] text-[0.5rem]">
                        <div>Total value</div>
                        <div>${Number(inputTokenXPrice)+Number(inputTokenYPrice)}</div>
                    </div>
                    <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
                        <div>{inputXToken}</div>
                        <div>${inputTokenXPrice}</div>
                    </div>
                    <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
                        <div>{inputYToken}</div>
                        <div>${inputTokenYPrice}</div>
                    </div>
                    <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
                        <div>LP fee</div>
                        <div>$100</div>
                    </div>
                    <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
                        <div>Share of pool</div>
                        <div>1%</div>
                    </div>
                    <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
                        <div>Fee</div>
                        <div>0.3%</div>
                    </div>

                    <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
                        <div>Network</div>
                        <div>SUI Network</div>
                    </div>

                    {/*<div className="flex justify-between mt-[0.5rem] text-[0.5rem]">*/}
                    {/*    <div>Network cost</div>*/}
                    {/*    <div className='flex items-center'>*/}
                    {/*        <Image className='mr-[0.1rem]' src='/gas.svg' width={20} height={20}></Image>*/}
                    {/*        $2.71</div>*/}
                    {/*</div>*/}

                    <div className="flex justify-center mt-[1rem]">
                        <button className="btn bg-[#0337FFCC] text-white w-[80%]" onClick={handleClick}>Add Liquidity</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </>
    );
}
