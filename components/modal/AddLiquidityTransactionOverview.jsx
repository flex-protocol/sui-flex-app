"use client";

import Image from "next/image";

export default function AddLiquidityTransactionOverview({
  handleClick,
  inputX,
  inputY,
  inputXToken,
  inputYToken,
  inputTokenXPrice,
  inputTokenYPrice,
  tokenXBalance,
  tokenYBalance,
  closeClick,
  numerator,
  denominator,
  impact,
}) {
  return (
    <>
      <dialog id="add_liquidity_transaction_overview_modal" className="modal">
        <div className="modal-box">
          <div className="flex items-center">
            <Image
              alt=""
              onClick={closeClick}
              className="cursor-pointer"
              src="/close.svg"
              width={20}
              height={20}
            ></Image>
            <span className="ml-4">Transaction Overview</span>
          </div>
          <div className="mb-[0.5rem] mt-[1rem]">Pair Token 1</div>

          <div className="flex justify-between text-[1rem]">
            <div>{inputX}</div>
            <div>{inputXToken}</div>
          </div>
          <div className="mt-[0.5rem]">Pair Token 2</div>
          <div className="flex justify-between mt-[0.5rem]  text-[1rem]">
            <div>{inputY}</div>
            <div>{inputYToken}</div>
          </div>

          <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
            <div>LP fee</div>
            <div>{(numerator / denominator) * 100}%</div>
          </div>
          <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
            <div>Share of pool</div>
            <div>~ {impact}%</div>
          </div>

          <div className="flex justify-between mt-[0.5rem] text-[0.55rem]">
            <div>Network</div>
            <div className="flex">
              SUI Network
              <Image
                alt=""
                className="ml-[0.2rem]"
                src="/icon/sui.svg"
                width={15}
                height={15}
              ></Image>
            </div>
          </div>

          <div className="flex justify-center mt-[1rem]">
            <button
              className="btn bg-[#0337FFCC] text-white w-[80%]"
              onClick={handleClick}
            >
              Add Liquidity
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
}
