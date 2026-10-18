import type { ReactNode } from "react";
import { Footer } from "../components/footer";
import { Header } from "../components/header";

export default function CoinsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
