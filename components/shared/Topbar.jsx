"use client";
import Link from "next/link";
import Image from "next/image";

import ConnectWallet from "@/components/wallet/ConnectWallet";
import AppToaster from "@/components/ui/AppToaster";
// import AppToaster from "@/components/ui/AppToaster";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { UniPassPopupSDK } from "@unipasswallet/popup-sdk";

export default function Topbar() {
  const pathname = usePathname();

  async function aaaaa() {
    const upWallet = new UniPassPopupSDK({
      env: "test",
      // for polygon mumbai
      chainType: "polygon",
      // choose localStorage if you want to cache user account permanent
      storageType: "sessionStorage",
      appSettings: {
        theme: "light",
        appName: "UniPass Wallet",
        appIcon: "",
      },
    });
    try {
      const account = await upWallet.login({
        email: true,
        eventListener: (event) => {
          console.log("event", event);
          const { type, body } = event;
          if (type === "REGISTER") {
            console.log("account", body);
            // ElMessage.success("a user register");
          }
        },
        connectType: "both",
      });
      const { address, email } = account;
      console.log("account", address, email);
    } catch (err) {
      console.log("connect err", err);
    }
  }

  return (
    <nav className="lg:flex hidden justify-between items-center h-[100px] border-b-white p-[24px_64px]">
      <Link href="/" className="flex-none">
        <Image
          src="/flex-logo.svg"
          alt="github-icon"
          width={286}
          height={48}
          priority
        />
      </Link>
      {pathname !== "/" ? (
        <div className="flex-1 flex items-center justify-center gap-[24px] font-['TWK Everett Mono']">
          <Link
            key="console"
            href="/console"
            className={`${
              pathname === "/console" &&
              "bg-[rgba(3,55,255,0.8)] text-white shadow-[0px_0px_12px_0px_#3556D5]"
            } text-[16px] hover:text-white duration-150 text-[#444] flex p-[4px_16px] justify-center items-center gap-[10px] rounded-[4px]`}
          >
            Console
          </Link>
          <Link
            key="meme-launch"
            href="/meme-launch"
            className={`${
              pathname === "/meme-launch" &&
              "bg-[rgba(3,55,255,0.8)] text-white shadow-[0px_0px_12px_0px_#3556D5]"
            } text-[16px] hover:text-white duration-150 text-[#444] flex p-[4px_16px] justify-center items-center gap-[10px] rounded-[4px]`}
          >
            Meme Launch
          </Link>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <Link
            key="about"
            href="/"
            className={` text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}
          >
            About
          </Link>
          <Link
            key="doc"
            href="/"
            className={` text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}
          >
            Doc
          </Link>
          <Link
            key="ecosystem"
            href="/"
            className={` text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem] px-[1rem] py-[0.25rem] rounded-[0.25rem] text-[1rem]`}
          >
            Ecosystem
          </Link>
        </div>
      )}

      <div className="flex-none">
        <ConnectWallet isFirstPage={pathname === "/" ? 1 : 0} />
        <AppToaster />
      </div>
    </nav>
  );
}
