"use client";

import Image from "next/image";

export default function ChainResult({title,inputX, inputY, inputXToken, inputYToken}) {

    return (
        <>

            <dialog id="my_modal_2" className="modal">
                <div className="modal-box flex flex-col items-center">
                    <Image src="/swapcat.svg" width={125} height={125}></Image>
                    <h3 className="font-bold text-[1rem] mt-[1rem] text-[#2A1638]">{title}</h3>
                    <div className="text-[0.75rem] flex justify-between items-center text-[#444] mt-[1rem]">
                        <span>{inputX} {inputXToken}</span>
                        <Image src="/right.svg" width={25} height={25}></Image>
                        <span>{inputY} {inputYToken}</span>
                    </div>
                    <p className="py-4  mt-[1rem] text-[0.875rem]">View on Explorer</p>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

        </>
    );
}
