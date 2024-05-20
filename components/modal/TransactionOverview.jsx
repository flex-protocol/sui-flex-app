"use client";

import Image from "next/image";

export default function TransactionOverview({handleClick, inputX,inputY,inputXToken,inputYToken}) {

    return (
        <>
            <dialog id="transaction_overview_modal" className="modal">
                <div className="modal-box">
                    <div><span>X</span><span className="ml-4">Transaction Overview</span></div>
                    <div className="mb-[0.5rem] mt-[0.25rem]">You pay</div>

                    <div className="flex justify-between text-[1rem]">
                        <div>{inputX}</div>
                        <div>{inputXToken}</div>
                    </div>
                    <div className="flex justify-between mt-[0.25rem] text-[0.5rem] text-[#808080]">
                        <div>$29.18</div>
                        <div>Balance: 39.18</div>
                    </div>
                    <div className="mt-[0.5rem]">
                        You receive
                    </div>
                    <div className="flex justify-between mt-[0.5rem]  text-[1rem]">
                        <div>{inputY}</div>
                        <div>{inputYToken}</div>
                    </div>
                    <div className="flex justify-between mt-[0.25rem] text-[0.5rem] text-[#808080]">
                        <div>$29.18</div>
                        <div>Balance: 39.18</div>
                    </div>
                    <div className="flex justify-center mt-[1rem]">
                        <button className="btn bg-[#0337FFCC] text-white w-[80%]" onClick={handleClick}>Swap</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </>
    );
}
