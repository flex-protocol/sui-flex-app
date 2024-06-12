"use client";

import {useEffect, useState} from "react";
import { useWallet, ConnectModal,ConnectButton } from "@suiet/wallet-kit";
import Link from "next/link";

export default function ConnectWallet({isFirstPage}) {
  const { connected,chains,chain } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const wallet = useWallet();

  return (
    <ConnectModal
      open={showModal}
      onOpenChange={(open) => setShowModal(open)}
      onConnectSuccess={() => setShowModal(false)}
    >
      <>
        {isFirstPage === 1 ?
            <Link  href="/console"  className="flex justify-center items-center border border-[#2d2d2d] rounded-full text-xl cursor-pointer px-8 py-2 text-[#030201] shadow-[0px_0px_8px_0px_#00000020]">
                Launch App
            </Link>
            :connected ? (
          // Display info after a user connected
          // <div className="font-['twkemono-Regular'] text-[#030201] bg-[#FFCD0F] border-2 border-[#FFCD0F] text-[1rem] px-[1rem] py-[0.5rem] rounded-full shadow-[0px_0px_8px_0px_#00000020]">{wallet.address.substr(0,5)+"..."+wallet.address.substr(wallet.address.length-4,wallet.address.length)}</div>
                <ConnectButton />
        ) : (
          // Custom connect button
          <div
            className="flex justify-center items-center border border-[#2d2d2d] rounded-full text-xl cursor-pointer px-8 py-2 shadow-[0px_0px_8px_0px_#00000020]"
            onClick={() => setShowModal(true)}
          >
            Connect Wallet
          </div>
        )}
      </>
    </ConnectModal>
  );
}
