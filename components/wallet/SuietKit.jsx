"use client";

import {useEffect, useState} from "react";
import {Chain, SuiDevnetChain, SuiMainnetChain, SuiTestnetChain, WalletProvider} from "@suiet/wallet-kit";

export default function SuietKit({children}) {
    const [ready, setReady] = useState(false);

    // Avoid hydration bug
    useEffect(() => {
        setReady(true);
    }, []);

    const customChain = {
        id: "sui:movement",
        name: "m2_devnet",
        rpcUrl: "https://sui.devnet.m2.movementlabs.xyz:443",
    };

    const SupportedChains = [
        // ...DefaultChains,
        SuiDevnetChain,
        SuiTestnetChain,
        SuiMainnetChain,
        // NOTE: you can add custom chain (network),
        // but make sure the connected wallet does support it
        customChain,
    ];

    return <>{ready && <WalletProvider chains={SupportedChains}>{children}</WalletProvider>}</>;
}
