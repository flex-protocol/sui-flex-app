"use client";

import Image from "next/image";
import Link from "next/link";
import coinInfo from "@/data/coin";
import {useEffect, useState} from "react";

export default function SelectAsset({handleClick, currentChain, isLoading, closeClick, selectTokenAsset}) {

    const [searchValue, setSearchValue] = useState('');

    let keys = Object.keys(coinInfo[currentChain]);


    const assetList = keys.map((key) => (
        (key !== '' && key.indexOf(searchValue) !== -1) &&
        <div className="flex items-center mt-[1rem] cursor-pointer ml-[1rem]" onClick={() => handleClick(key, selectTokenAsset)}>
            <div className="mr-[1rem]">
                <Image alt='' src={coinInfo[currentChain][key].image} width={40} height={40}></Image>
            </div>
            <div>
                <div>
                    <span className='font-[400]'>{coinInfo[currentChain][key].name}</span>
                    {/*<span>SUI.Token</span>*/}
                </div>
                <div>
                    <span className='font-[400]'>Defi</span>
                </div>
            </div>
        </div>
    ))

    const searchAsset = async (e) => {
        setSearchValue(e.target.value)
    };

    return (
        <>
            <dialog id="select_asset_modal" className="modal">
                <div className="modal-box">
                    <div className="flex items-center">
                        {/*<span className="cursor-pointer"  onClick={closeClick}>X</span>*/}
                        <Image alt='' onClick={closeClick} className="cursor-pointer" src="/close.svg" width={20} height={20}></Image>
                        <span className="ml-4">Select Asset</span>
                        {isLoading && <span className="ml-3 loading loading-spinner loading-sm"></span>}
                    </div>
                    <div className='my-[0.5rem] py-[0.25rem] px-[0.25rem] rounded-[1rem]'>
                        <input className='py-[0.5rem] px-[1rem] w-[90%] rounded-[1rem]' type="text" placeholder="Search Name or Address" onChange={searchAsset} value={searchValue}/></div>
                    {assetList}
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </>
    );
}
