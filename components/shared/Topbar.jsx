"use client";
import Link from "next/link";
import Image from "next/image";

import ConnectWallet from "@/components/wallet/ConnectWallet";
import AppToaster from "@/components/ui/AppToaster";
// import AppToaster from "@/components/ui/AppToaster";
import {useEffect, useState} from "react";
import {useRouter, usePathname} from "next/navigation";

export default function Topbar() {

    const pathname = usePathname()

    return (
        <>
            <nav className="lg:flex hidden justify-between items-center h-[100px] border-b-white px-8">
                <Link href="/">
                    <Image src="/logo.svg" alt="github-icon" width={200} height={100} priority/>
                </Link>
                {pathname !== '/' ? <div className="flex items-center justify-center font-['twkemono-bold']">
                        <Link key="console" href="/console" className={`${pathname === '/console' && 'bg-[#3556D5] text-white'} text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}>
                            Console
                        </Link>
                        <Link key="mypool" href="/mypool" className={`${pathname === '/mypool' && 'bg-[#3556D5] text-white'} text-xl hover:text-white duration-150  text-[#444] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}>
                            My Pool
                        </Link>
                        {/*<Link href="/" className="text-2xl goldman-bold">*/}
                        {/*  Flex Protocol*/}
                        {/*</Link>*/}

                    </div> :
                    <div>
                        <Link key="about" href="/" className={` text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}>
                            About
                        </Link>
                        <Link key="doc" href="/" className={` text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}>
                            Doc
                        </Link>
                        <Link key="ecosystem" href="/" className={` text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}>
                            Ecosystem
                        </Link>

                    </div>
                }

                <ConnectWallet isFirstPage={pathname === '/' ? 1 : 0}/>
                <AppToaster/>

                {/*<AppToaster />*/}
            </nav>
        </>
    );
}
