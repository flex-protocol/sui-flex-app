"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useWallet} from "@suiet/wallet-kit";

export default function TxToast({title, digest}) {
    const [url, setUrl] = useState("");

    const {chain} = useWallet();

    useEffect(() => {
        console.log('TxToastTxToast')
        if (chain?.name === "Sui Testnet") setUrl(`https://suiscan.xyz/testnet/tx/${digest}`);
        // if (chain?.name === "Sui Mainnet") setUrl(`https://suiscan.xyz/mainnet/tx/${digest}`);
    }, [chain?.name, digest]);

    return (
        <div className="w-[369px] bg-white text-black shadow-lg rounded-xl flex items-center gap-3 py-4 px-6">
            {/*<div>😃</div>*/}
            <div>
                {title}{" "}
                {/*<Link className="text-violet-700 hover:text-violet-600 duration-200" href={url} target="_blank">*/}
                {/*    View on Suiscan*/}
                {/*</Link>*/}
                .
            </div>
        </div>
    );
}
