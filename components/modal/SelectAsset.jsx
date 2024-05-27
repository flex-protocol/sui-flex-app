"use client";

import Image from "next/image";
import Link from "next/link";
import coinInfo from "@/data/coin";

export default function SelectAsset({handleClick,currentChain,isLoading}) {

    console.log('coinInfo[currentChain]', coinInfo[currentChain])
    let keys = Object.keys(coinInfo[currentChain]);

    const assetList = keys.map((key) => (
        key !== '' &&
        <div className="flex items-center mt-[1rem] cursor-pointer ml-[1rem]" onClick={() => handleClick(key)}>
            <div className="mr-[1rem]">
                <Image alt='' src={coinInfo[currentChain][key].image} width={40} height={40}></Image>
            </div>
            <div>
                <div>
                    <span className='font-[400]'>{coinInfo[currentChain][key].name}</span>
                    {/*<span>SUI.Token</span>*/}
                </div>
                <div>
                    <span  className='font-[400]'>Defi</span>
                </div>
            </div>
        </div>
    ));

    return (
        <>
            <dialog id="select_asset_modal" className="modal">
                <div className="modal-box">
                    <div className="ml-[1rem]">
                        <span>X</span>
                        <span  className="ml-4">Select Asset</span>
                        {isLoading && <span className="ml-3 loading loading-spinner loading-sm"></span>}
                    </div>
                    <div className='my-[0.5rem] py-[0.25rem] px-[0.25rem] rounded-[1rem]'><input className='py-[0.5rem] px-[0.5rem] w-[90%] rounded-[1rem]' type="text" placeholder="Search Name or Address"/></div>
                    {assetList}
                    {/*<div className="flex items-center mt-[1rem] cursor-pointer ml-[1rem]"  onClick={() => handleClick("0x71ec440c694153474dd2a9c5c19cf60e2968d1af51aacfa24e34ee96a2df44dd::example_coin::EXAMPLE_COIN")}>*/}
                    {/*    <div className="mr-[1rem]">*/}
                    {/*        <Image alt='' src="/cat.svg" width={40} height={40}></Image>*/}
                    {/*    </div>*/}
                    {/*    <div>*/}
                    {/*        <div>*/}
                    {/*            <span>EXAMPLE_COIN</span>*/}
                    {/*            /!*<span>EXAMPLE_COIN.Token</span>*!/*/}
                    {/*        </div>*/}
                    {/*        <div>*/}
                    {/*            <span>Defi</span>*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </>
    );
}
