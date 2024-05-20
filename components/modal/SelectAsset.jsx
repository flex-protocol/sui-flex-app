"use client";

import Image from "next/image";

export default function TransactionOverview({handleClick}) {

    return (
        <>
            <dialog id="select_asset_modal" className="modal">
                <div className="modal-box">
                    <div><span>X</span><span  className="ml-4">Select Asset</span></div>
                    <div><input type="text" placeholder="Search Name or Address"/></div>
                    <div className="flex items-center mt-[0.5rem]" onClick={() => handleClick("0000000000000000000000000000000000000000000000000000000000000002::sui::SUI")}>
                        <div className="mr-[0.5rem]">
                            <Image src="/cat.svg" width={40} height={40}></Image>
                        </div>
                        <div>
                            <div>
                                <span>SUI</span>
                                {/*<span>SUI.Token</span>*/}
                            </div>
                            <div>
                                <span>Defi</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mt-[0.5rem]"  onClick={() => handleClick("0x7d6ed7690d4501cc83f1bdab01e45738022890da4030eee655cdbcb985a6f072::example_coin::EXAMPLE_COIN")}>
                        <div className="mr-[0.5rem]">
                            <Image src="/cat.svg" width={40} height={40}></Image>
                        </div>
                        <div>
                            <div>
                                <span>EXAMPLE_COIN</span>
                                {/*<span>EXAMPLE_COIN.Token</span>*/}
                            </div>
                            <div>
                                <span>Defi</span>
                            </div>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </>
    );
}
