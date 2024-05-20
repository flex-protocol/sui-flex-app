"use client";

import { useState } from "react";
import { useWallet, ConnectModal } from "@suiet/wallet-kit";

export default function ConnectWallet() {
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
        {connected ? (
          // Display info after a user connected
          <div>10sui | 0xaaa...bbb</div>
        ) : (
          // Custom connect button
          <div
            className="flex justify-center items-center border-2 border-[#2d2d2d] rounded-full text-xl cursor-pointer px-8 py-2"
            onClick={() => setShowModal(true)}
          >
            Connect Wallet
          </div>
        )}
      </>
    </ConnectModal>
  );
}
