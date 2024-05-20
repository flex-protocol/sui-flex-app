import Link from "next/link";
// import { useState } from "react";
import Image from "next/image";
import {getAllExchanges} from "@/actions/ftassets.action";
import {calculateSwapAmountOut} from "../../actions/ftassets.action";
import Swap from "../../components/swap/Swap";


export default async function page({params}) {

    // const [xAmount, setXAmount] = useState(0);
    // const [yAmount, setYAmount] = useState(0);
    // const {
    //     getObject,
    //     getOwnedObjects,
    //     getBalance,
    //     // ... other methods
    // } = useSuiProvider();

    // const {
    //     getObject,
    //     getOwnedObjects,
    //     getBalance,
    //     // ... other methods
    // } = useSuiProvider();

    // const provider = new JsonRpcProvider(devnetConnection);
    // get tokens from the DevNet faucet server
    // const objects = await getObject(
    //     '0x32295beac0c29ba32bd35cb38d8ef9984f474ce91b21bfd0945a9a7186f9fd9c',
    // );
    // console.log('objects', objects)

    // const { data: swapAmountOut } = await calculateSwapAmountOut(xAmount)
    return (
        <Swap></Swap>
    );
}
