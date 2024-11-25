"use client";

import Image from "next/image";
import { useWallet } from "@suiet/wallet-kit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Tabbar() {
  const pathname = usePathname();
  // const [activeTab, setActiveTab] = useState('');

  // useEffect(() => {
  //     if (pathname === '') {
  //         setActiveTab('')
  //     } else {
  //         setActiveTab(pathname)
  // }, [pathname]);

  const socialInfos = [
    { id: 0, name: "twitter", url: "/" },
    // { id: 1, name: "linkedin", url: "/" },
    // { id: 2, name: "facebook", url: "/" },
    { id: 3, name: "github", url: "/" },
  ];
  const socialIcons = socialInfos.map((info) => (
    <Link key={info.id} className="opacity-50" href={info.url}>
      <Image
        className="opacity-50 hover:opacity-100 duration-150"
        src={`/icon/${info.name}.svg`}
        alt={`${info.name}-icon`}
        width={24}
        height={24}
        priority
      />
    </Link>
  ));

  return (
    <footer
      className={`absolute w-[100%] ${
        pathname === "/" ? "bottom-6" : "bottom-0"
      }`}
    >
      {pathname !== "/" ? (
        <div className="flex justify-center">
          <Image alt="" src="/cat.svg" width={200} height={200}></Image>
        </div>
      ) : (
        <div className="flex justify-around">
          <p className="text-base opacity-50 text-[#444] font-['twkemono-Regular']">
            © 2024 Flex Protocol. All rights reserved.
          </p>
          <div className="flex items-center gap-8">{socialIcons}</div>
        </div>
      )}
    </footer>
  );
}
