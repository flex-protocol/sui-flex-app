import Link from "next/link";
import Image from "next/image";

import ConnectWallet from "@/components/wallet/ConnectWallet";
import AppToaster from "@/components/ui/AppToaster";
// import AppToaster from "@/components/ui/AppToaster";

export default function Topbar() {

  return (
    <>
      <nav className="lg:flex hidden justify-between items-center h-[100px] border-b-white px-8">
        <Link href="/">
          <Image src="/logo.svg" alt="github-icon" width={200} height={100} priority />
        </Link>
        <div className="flex items-center justify-center">
          <Link key="console" href="/console" className="text-xl hover:text-white duration-150 text-[#444] mr-[1.5rem]">
            console
          </Link>
          <Link key="mypool" href="/mypool" className="text-xl hover:text-white duration-150  text-[#444]">
            My Pool
        </Link>
          {/*<Link href="/" className="text-2xl goldman-bold">*/}
          {/*  Flex Protocol*/}
          {/*</Link>*/}

        </div>

        <ConnectWallet />
        <AppToaster />

        {/*<AppToaster />*/}
      </nav>
    </>
  );
}
