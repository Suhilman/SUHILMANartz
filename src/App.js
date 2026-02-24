import React, { useState } from 'react';
import Hero from './components/Hero';
import Header from './components/Header';
import About from './components/About';
import Experience from './components/Experience';
import Animation from './components/Animation';
import Documentation from './components/Documentation';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const sections = [
    { id: 'hero', component: <Hero isDarkMode={isDarkMode} /> },
    { id: 'about', component: <About isDarkMode={isDarkMode} /> },
    { id: 'experience', component: <Experience isDarkMode={isDarkMode} /> },
    { id: 'animation', component: <Animation isDarkMode={isDarkMode} /> },
    { id: 'documentation', component: <Documentation isDarkMode={isDarkMode} /> },
    { id: 'contact', component: <Contact isDarkMode={isDarkMode} /> },
    { id: 'footer', component: <Footer isDarkMode={isDarkMode} /> },
  ];

  const toggleTheme = () => {
    setIsDarkMode(prevMode => !prevMode);
    document.body.setAttribute('data-theme', !isDarkMode ? 'dark' : 'light');
  };

  return (
    <div>
      <Header isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
      {sections.map((section) => (
        <section id={section.id} key={section.id}>
          {section.component}
        </section>
      ))}
    </div>
  );
}

export default App;
