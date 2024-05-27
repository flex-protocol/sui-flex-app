"use client";

import Image from "next/image";
import config from "@/data/config";

export default function ChainResult({title, inputX, inputY, inputXToken, inputYToken, resultHash, currentChain}) {

    return (
        <>

            <dialog id="my_modal_2" className="modal">
                <div className="modal-box flex flex-col items-center">
                    <Image alt='' src="/swapcat.svg" width={125} height={125}></Image>
                    <h3 className="font-bold text-[1rem] mt-[1rem] text-[#2A1638]">{title}</h3>
                    <div className="text-[0.75rem] flex justify-between items-center text-[#444] mt-[1rem]">
                        <span>{inputX} {inputXToken}</span>

                        {title.indexOf('Swap') !== -1 ? <Image alt='' src="/right.svg" width={25} height={25}></Image> : <Image src="/leftright.svg" width={25} height={25}></Image>}
                        <span>{inputY} {inputYToken}</span>
                    </div>
                    <a target="_blank" href={config[currentChain+"Explorer"] + resultHash + (currentChain === 'm2' ? '?network=devnet' : "")} className="py-4  mt-[1rem] text-[0.875rem] text-[#2837FE]">View on Explorer</a>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </>
    );
}


// https://explorer.sui.devnet.m2.movementlabs.xyz/txblock/EsUG5vHfGUuBnNs7drLYS1u89k4K4wD1KsQrBcdhXAxg?network=devnet
