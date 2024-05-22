import { Inter } from "next/font/google";
import "./globals.css";
import SuietKit from "@/components/wallet/SuietKit";
import Topbar from "@/components/shared/Topbar";
import Tabbar from "@/components/shared/Tabbar";
// import Tabbar from "@/components/shared/Tabbar";
import "@suiet/wallet-kit/style.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Flex Protocol",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>

      <SuietKit>
          <main className="flex flex-col min-h-screen text-white bg-main bg-[#FAD457] font-['TwkeRegular']">

              <Topbar />

              {children}

              <Tabbar/>

          </main>
      </SuietKit>
      </body>
    </html>
  );
}
