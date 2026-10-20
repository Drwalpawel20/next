import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FireSmokeDemo from "@/components/FireSmokeDemo";

export const metadata: Metadata = {
  title: "Detekcja ognia i dymu na wideo",
  description: "Demo modelu YOLO26s wykrywającego ogień i dym w nagraniach wideo.",
};

export default function FireSmokePage() {
  return <><Header page="demo" /><main className="demo-page"><FireSmokeDemo /></main><Footer page="about" /></>;
}
