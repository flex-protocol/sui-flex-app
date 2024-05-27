import Image from "next/image";

export default function Home() {
    return (
        <main className="flex">
            <div className="border rounded-r-[1rem] bg-[#f1fbc4] pl-[4.62rem] pb-[3.12rem] mt-[2.5rem]">
                <div className="font-['twkemono-bold'] text-[3rem] text-[#030201] mt-[2rem]">
                    Asset Diversified Liquidity Swap
                </div>
                <div className="text-[1.5rem] text-[#030201] mt-[2.5rem] mb-[2.5rem]">
                    Supported Features \Move-native
                </div>
                <Image alt='' src='/TradePoolButtom.png' width={600} height={400}></Image>
            </div>
            <div className="border ml-[1.25rem] rounded-l-[1rem] bg-[#f1fbc4] pl-[3.19rem] mt-[2.5rem]">
                <div className="font-['twkemono-bold'] text-[#030201] text-[2rem] mt-[2.5rem]">Support for Multiple Token Types</div>
                <div className="text-[1.25rem] text-[#030201] font-[400] mt-[4rem]">Fungible Token (FT)</div>
                <div className="text-[1.25rem] text-[#030201] font-[400] mt-[4rem]">Non-Fungible Token (NFT)</div>
                <div className="text-[1.25rem] text-[#030201] font-[400] mt-[4rem]">Smart-Fungible Token (SFT)</div>
            </div>
        </main>
    );
}
