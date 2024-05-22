"use client";
import Link from "next/link";
import Image from "next/image";

import ConnectWallet from "@/components/wallet/ConnectWallet";
import AppToaster from "@/components/ui/AppToaster";
// import AppToaster from "@/components/ui/AppToaster";
import {useState} from "react";

export default function Topbar() {

    const [activeTab, setActiveTab] = useState('');

    function switchTab(action) {
        setActiveTab(action)
    }

    return (
        <>
            <nav className="lg:flex hidden justify-between items-center h-[100px] border-b-white px-8">
                <Link href="/" onClick={() => switchTab('')}>
                    <Image src="/logo.svg" alt="github-icon" width={200} height={100} priority/>
                </Link>
                <div className="flex items-center justify-center font-['twkemono-bold']">
                    <Link onClick={() => switchTab('console')} key="console" href="/console" className={`${activeTab === 'console' && 'bg-[#3556D5] text-white'} text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}>
                        Console
                    </Link>
                    <Link key="mypool" onClick={() => switchTab('mypool')} href="/mypool" className={`${activeTab === 'mypool' && 'bg-[#3556D5] text-white'} text-xl hover:text-white duration-150  text-[#444] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}>
                        My Pool
                    </Link>
                    {/*<Link href="/" className="text-2xl goldman-bold">*/}
                    {/*  Flex Protocol*/}
                    {/*</Link>*/}

                </div>

                <ConnectWallet/>
                <AppToaster/>

                {/*<AppToaster />*/}
            </nav>
        </>
    );
}
