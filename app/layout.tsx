import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "仓鼠收纳 · 搬家清单",
  description: "把搬家物品、位置和商品信息整理成一份可持续维护的清单。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
