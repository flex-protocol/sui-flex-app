"use client";

import { useEffect, useState } from "react";
import { useWallet, ConnectModal, ConnectButton } from "@suiet/wallet-kit";
import Link from "next/link";
import { WalletSelector } from "./WalletSelector";

export default function ConnectWallet({ isFirstPage }) {
  const { connected, chains, chain } = useWallet();
  const [showModal, setShowModal] = useState(false);
  const wallet = useWallet();

  return (
    <ConnectModal
      open={showModal}
      onOpenChange={(open) => setShowModal(open)}
      onConnectSuccess={() => setShowModal(false)}
    >
      <>
        {isFirstPage === 1 ? (
          <Link
            href="/console"
            className="flex justify-center items-center border border-[#2d2d2d] rounded-full text-xl cursor-pointer px-8 py-2 text-[#030201] shadow-[0px_0px_8px_0px_#00000020]"
          >
            Launch App
          </Link>
        ) : (
          <WalletSelector />
        )}
      </>
    </ConnectModal>
  );
}
