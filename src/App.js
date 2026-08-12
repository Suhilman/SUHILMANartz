import React, { useState, useEffect, lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Lenis from 'lenis';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Stats from './components/Stats';
import Marquee from './components/Marquee';
import Preloader from './components/Preloader';
import CursorOverlay from './components/CursorOverlay';
import DocViewer from './components/DocViewer';
import './App.css';

const ToolLocationSimulator = lazy(() => import('./pages/tools/ToolLocationSimulator'));

const Experience    = lazy(() => import('./components/Experience'));
const Animation     = lazy(() => import('./components/Animation'));
const Tools         = lazy(() => import('./components/Tools'));
const Documentation = lazy(() => import('./components/Documentation'));
const Testimonials  = lazy(() => import('./components/Testimonials'));
const Contact       = lazy(() => import('./components/Contact'));
const Footer        = lazy(() => import('./components/Footer'));

const SectionFallback = () => <div style={{ minHeight: '40vh' }} />;

function MainPage({ isDarkMode, toggleTheme, bootDone }) {
  // Scoped here (not in App) so Lenis's global wheel-event takeover only runs while
  // this route is actually mounted — otherwise it also intercepts scrolling inside
  // DocViewer's own scrollable area on /cv and /portfolio, and dragging the native
  // scrollbar thumb becomes the only thing that still works there.
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

  return (
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

      <section id="tools">
        <Suspense fallback={<SectionFallback />}>
          <Tools />
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
  );
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [bootDone, setBootDone] = useState(false);

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

  const toggleTheme = () => setIsDarkMode((m) => !m);

  return (
    <HashRouter>
      <Preloader onDone={() => setBootDone(true)} />
      <CursorOverlay />

      <Routes>
        <Route
          path="/"
          element={<MainPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} bootDone={bootDone} />}
        />
        <Route
          path="/cv"
          element={
            <DocViewer
              title="Suhilman — Curiculum Vitae"
              docType="cv"
              swapRoute="/portfolio"
              swapLabel="View Portfolio"
            />
          }
        />
        <Route
          path="/portfolio"
          element={
            <DocViewer
              title="Suhilman — Portfolio"
              docType="portfolio"
              swapRoute="/cv"
              swapLabel="View Curiculum Vitae"
            />
          }
        />
        <Route
          path="/tools/location-simulator"
          element={
            <Suspense fallback={<SectionFallback />}>
              <ToolLocationSimulator />
            </Suspense>
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
