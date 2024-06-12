import Link from "next/link";
// import { useState } from "react";
import Image from "next/image";
import {getAllExchanges} from "@/actions/ftassets.action";
import {calculateSwapAmountOut} from "../../actions/ftassets.action";
import Swap from "../../components/swap/Swap";


export default async function page({params}) {

    return (
        <div className="flex items-center justify-center text-bold mt-[20%] text-[#FFFFFF] text-[48px] font-['twkemono-bold']">Coming Soon</div>
    );
}
