import React, { useState, useEffect, lazy, Suspense } from 'react';
import Lenis from 'lenis';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Stats from './components/Stats';
import Marquee from './components/Marquee';
import Preloader from './components/Preloader';
import CursorOverlay from './components/CursorOverlay';
import './App.css';

const Experience    = lazy(() => import('./components/Experience'));
const Animation     = lazy(() => import('./components/Animation'));
const Documentation = lazy(() => import('./components/Documentation'));
const Testimonials  = lazy(() => import('./components/Testimonials'));
const Contact       = lazy(() => import('./components/Contact'));
const Footer        = lazy(() => import('./components/Footer'));

const SectionFallback = () => <div style={{ minHeight: '40vh' }} />;

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [bootDone, setBootDone] = useState(false);

  /* Theme: localStorage → system pref → fallback dark */
  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') {
      setIsDarkMode(saved === 'dark');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      setIsDarkMode(false);
    }
  }, []);

  useEffect(() => {
    const t = isDarkMode ? 'dark' : 'light';
    document.body.setAttribute('data-theme', t);
    localStorage.setItem('theme', t);
  }, [isDarkMode]);

  /* Smooth scroll via Lenis */
  useEffect(() => {
    if (!bootDone) return;
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    let raf;
    const loop = (time) => { lenis.raf(time); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); lenis.destroy(); };
  }, [bootDone]);

  const toggleTheme = () => setIsDarkMode((m) => !m);

  return (
    <>
      <Preloader onDone={() => setBootDone(true)} />
      <CursorOverlay />

      <div className="App">
        <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />

        <section id="hero">
          <Hero isDarkMode={isDarkMode} />
        </section>

        <section id="about">
          <About isDarkMode={isDarkMode} />
        </section>

        <Stats />

        <section id="experience">
          <Suspense fallback={<SectionFallback />}>
            <Experience isDarkMode={isDarkMode} />
          </Suspense>
        </section>

        <Marquee />

        <section id="animation">
          <Suspense fallback={<SectionFallback />}>
            <Animation isDarkMode={isDarkMode} />
          </Suspense>
        </section>

        <section id="documentation">
          <Suspense fallback={<SectionFallback />}>
            <Documentation isDarkMode={isDarkMode} />
          </Suspense>
        </section>

        <section id="testimonials">
          <Suspense fallback={<SectionFallback />}>
            <Testimonials isDarkMode={isDarkMode} />
          </Suspense>
        </section>

        <section id="contact">
          <Suspense fallback={<SectionFallback />}>
            <Contact isDarkMode={isDarkMode} />
          </Suspense>
        </section>

        <section id="footer">
          <Suspense fallback={<SectionFallback />}>
            <Footer isDarkMode={isDarkMode} />
          </Suspense>
        </section>
      </div>
    </>
  );
}

export default App;
