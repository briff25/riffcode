import SiteHeader from "@/components/SiteHeader";
import Hero from "@/components/hero/Hero";
import About from "@/components/About";
import Journey from "@/components/Journey";
import Press from "@/components/Press";
import Lab from "@/components/Lab";
import Contact, { SiteFooter } from "@/components/Contact";

export default function Home() {
  return (
    <div id="top">
      <SiteHeader />
      <main id="main">
        <Hero />
        <About />
        <Journey />
        <Press />
        <Lab />
        <Contact />
      </main>
      <SiteFooter />
    </div>
  );
}
