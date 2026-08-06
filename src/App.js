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

const Experience    = lazy(() => import('./components/Experience'));
const Animation     = lazy(() => import('./components/Animation'));
const Tools         = lazy(() => import('./components/Tools'));
const Documentation = lazy(() => import('./components/Documentation'));
const Testimonials  = lazy(() => import('./components/Testimonials'));
const Contact       = lazy(() => import('./components/Contact'));
const Footer        = lazy(() => import('./components/Footer'));

const SectionFallback = () => <div style={{ minHeight: '40vh' }} />;

function MainPage({ isDarkMode, toggleTheme }) {
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

  // Asset URLs (respect PUBLIC_URL for /SUHILMANartz/ subpath on GitHub Pages)
  const pub = process.env.PUBLIC_URL || '';

  return (
    <HashRouter>
      <Preloader onDone={() => setBootDone(true)} />
      <CursorOverlay />

      <Routes>
        <Route
          path="/"
          element={<MainPage isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
        />
        <Route
          path="/cv"
          element={
            <DocViewer
              title="Suhilman — Curiculum Vitae"
              htmlSrc={`${pub}/cv-suhilman.html`}
              downloadSrc={`${pub}/CV-SUHILMAN.pdf`}
              downloadName="CV Suhilman.pdf"
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
              htmlSrc={`${pub}/portfolio.html`}
              downloadSrc={`${pub}/portofolio-suhilman.pdf`}
              downloadName="Portofolio Suhilman.pdf"
              swapRoute="/cv"
              swapLabel="View Curiculum Vitae"
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
