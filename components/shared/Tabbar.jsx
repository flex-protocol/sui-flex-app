"use client";

import Image from "next/image";
import {useWallet} from "@suiet/wallet-kit";

export default function Tabbar() {

  return (
    <>
      <footer className="flex justify-center items-end">
        <Image src="/cat.svg" width={200} height={200}></Image>
      </footer>

    </>
  );
}
