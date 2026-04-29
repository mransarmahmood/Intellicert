import { useEffect } from 'react';
import AnnouncementBar from './components/AnnouncementBar';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Marquee from './components/Marquee';
import Method from './components/Method';
import ProductPreview from './components/ProductPreview';
import Stats from './components/Stats';
import Flow from './components/Flow';
import Features from './components/Features';
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
      <AnnouncementBar />
      <div className="relative z-10">
        <Nav />
        <Hero />
        <Marquee />
        <Method />
        <ProductPreview />
        <Stats />
        <Flow />
        <Features />
        <Testimonials />
        <Pricing />
        <FAQ />
        <CTA />
        <Footer />
      </div>
    </div>
  );
}
