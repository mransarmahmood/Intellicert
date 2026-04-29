import { useEffect } from 'react';
import AnnouncementBar from './components/AnnouncementBar';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Certifications from './components/Certifications';
import Science from './components/Science';
import Flow from './components/Flow';
import Features from './components/Features';
import PrepMethods from './components/PrepMethods';
import Domains from './components/Domains';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function App() {
  useEffect(() => {
    // Support old hash-based links like /#/login and /#/register.
    const h = (window.location.hash || '').toLowerCase();
    if (h === '#/login') {
      window.location.replace('/app/login');
      return;
    }
    if (h === '#/register') {
      window.location.replace('/app/login');
      return;
    }
    if (h === '#/pricing') {
      window.location.replace('/#pricing');
    }
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-surface">
      {/* Soft ambient mesh */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[900px] bg-mesh-light" />
      <AnnouncementBar />
      <div className="relative z-10 pt-10">
        <Nav />
        <Hero />
        <Marquee />
        <Certifications />
        <Science />
        <Flow />
        <Features />
        <PrepMethods />
        <Domains />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}
