/**
 * Single source of truth for the CV's text content — consumed by both the
 * on-screen React component (src/components/CvDocument.js) and the vector
 * PDF generator (public/pdf/cv.js). Edit content here; layout/styling lives
 * in each renderer separately since a browser and a PDF page draw very
 * differently.
 */
export default {
  name: 'SUHILMAN',
  role: 'Application Developer',
  avatarSrc: 'suhilman.jpg',
  portfolioUrl: 'https://suhilman.github.io/SUHILMANartz/',

  contact: [
    { label: 'Phone', value: '+62 851-7233-5192' },
    { label: 'Email', value: 'Suhilman.sch@gmail.com' },
    { label: 'Location', value: 'Ciawi, Bogor 16720, Indonesia' },
    { label: 'Portfolio', value: 'suhilman.github.io/SUHILMANartz' },
    { label: 'LinkedIn', value: 'linkedin.com/in/suhilman' },
    { label: 'GitHub', value: 'github.com/Suhilman' },
  ],

  professionalSkills: [
    { name: 'React / Next.js / Vue.js', pct: 90 },
    { name: 'Dart / Flutter / Frog', pct: 80 },
    { name: 'PostgreSQL / MySQL / MongoDB', pct: 78 },
    { name: 'UI/UX Design (Figma)', pct: 75 },
    { name: 'Laravel / Node.js / PHP', pct: 65 },
    { name: 'Swift / React Native', pct: 60 },
  ],

  softSkills: [
    { name: 'Communication', pct: 90 },
    { name: 'System Analysis', pct: 90 },
    { name: 'Problem Solving', pct: 85 },
    { name: 'Algorithm & Logic', pct: 80 },
  ],

  languages: [
    { name: 'Indonesian', level: 'Native' },
    { name: 'English', level: 'Professional' },
  ],

  eyebrow: '// CURRICULUM VITAE',
  title: 'Application Developer',
  tag: '5+ yrs · 10+ shipped · Available',

  kpis: [
    { n: '5+', label: 'Years\nExperience' },
    { n: '10+', label: 'Projects\nShipped' },
    { n: '3', label: 'Industries\nServed' },
    { n: '24/7', label: 'Used in\nProduction' },
  ],

  profile: [
    { text: 'App Developer with ', strong: false },
    { text: '5+ years', strong: true },
    { text: ' of experience shipping digital products across satellite telecommunications, POS, CRM, and internal platforms. Specialized in ', strong: false },
    { text: 'React, Next.js, Vue.js, and Flutter', strong: true },
    { text: ' — currently focused on full-stack Dart (Flutter + Frog + PostgreSQL). Led UI/UX development of the Network Monitoring System dashboard used daily by the ', strong: false },
    { text: 'BAKTI KOMINFO', strong: true },
    { text: ' team running the SATRIA-1 satellite HUB.', strong: false },
  ],

  jobs: [
    {
      company: 'PT. BIS DATA INDONESIA',
      period: '08/2023 — Present',
      role: 'Front End Developer',
      location: 'Jakarta, Indonesia',
      bullets: [
        [{ text: 'NADIA — NMS for SATRIA-1 Satellite HUB (BAKTI KOMINFO, Jayapura):', strong: true }, { text: ' mobile & web monitoring, integrated FORTIGATE, HUAWEI Core Switch, HPE ProLiant.', strong: false }],
        [{ text: 'VIONA — Multi-HUB NMS (Jayapura, Manokwari, Timika):', strong: true }, { text: ' unified topology, alert routing, device status across 3 regions.', strong: false }],
        [{ text: 'LOOKUP MY IP', strong: true }, { text: ' internal monitoring tool: built an application to track detailed device IP, geolocation, and network data; maintained AWS, weekly progress reports to BAKTI KOMINFO.', strong: false }],
        [{ text: 'ARTZ HR', strong: true }, { text: ' — end-to-end HR platform (attendance, payroll, leave, directory) with RBAC, audit logs, Flutter mobile + web client.', strong: false }],
        [{ text: 'BDI Chat', strong: true }, { text: ' — real-time messaging (channels, DMs, file sharing) over WebSocket with PostgreSQL full-text search & offline cache.', strong: false }],
        [{ text: 'ELARA — Enterprise Logic, Analytics & Responsiveness Assistant:', strong: true }, { text: ' AI chat assistant for reasoning, drafting, planning, and Q&A across text, documents, sheets, and slides.', strong: false }],
        [{ text: 'Benggala — Monitoring Pengadaan · LKPP:', strong: true }, { text: ' real-time procurement monitoring dashboard tracking tender methods and budget allocation for Indonesia’s national procurement agency.', strong: false }],
      ],
      tech: 'JavaScript · Next.js · MUI · Dart · Flutter · Frog · PostgreSQL · WebSocket · JWT · Cloudflare · AWS · GitHub · Figma · Google Maps API',
    },
    {
      company: 'PT. Life Tech Tanpa Batas',
      period: '08/2021 — 08/2023',
      role: 'Front End Developer',
      location: 'Bandung, Indonesia',
      bullets: [
        [{ text: 'BeetPOS & BeetClinic', strong: true }, { text: ' — designed UI/UX, built back-office, integrated Tokopedia, Shopee & QRIS; fixed payment-method bugs.', strong: false }],
        [{ text: 'CRM MRT', strong: true }, { text: ' — designed and developed the CRM, payment integration, role-based dashboards, customer activity timeline.', strong: false }],
        [{ text: 'Code reviews, staging/production deployments, cross-functional collaboration.', strong: false }],
      ],
      tech: 'React.js · Vue.js · Vuetify · REST API · Figma · Photoshop · GitHub',
    },
    {
      company: 'Cave Laundry',
      period: '12/2020 — 03/2021',
      role: 'Full Stack Developer',
      location: 'Bogor, Indonesia',
      bullets: [
        [{ text: 'Built a cashier app with real-time chat via WebSocket; designed for low latency & high availability.', strong: false }],
        [{ text: 'Deployed to staging & production; iterated based on store-operator feedback.', strong: false }],
      ],
      tech: 'Bootstrap · Laravel · MySQL · jQuery',
    },
  ],

  education: [
    { school: 'Pakuan University', major: 'Computer Science', year: '2017 — 2024' },
    { school: 'SMK Wikrama Bogor', major: 'Software Engineering', year: '2014 — 2017' },
    { school: 'SMP Negeri 2 Megamendung', major: 'Junior High School', year: '2011 — 2014' },
    { school: 'SD Negeri Ciawi 03', major: 'Elementary School', year: '2006 — 2011' },
  ],

  techStack: [
    'React', 'Next.js', 'Vue.js', 'Flutter', 'Dart', 'Frog', 'JavaScript', 'TypeScript',
    'Node.js', 'Laravel', 'PHP', 'Swift', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker',
    'MUI', 'Tailwind', 'Vuetify', 'Figma', 'REST API', 'WebSocket', 'JWT', 'Cloudflare',
    'AWS', 'GitHub',
  ],
};
