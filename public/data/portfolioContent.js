/**
 * Single source of truth for the Portfolio's text content — consumed by both
 * the on-screen React component (src/components/PortfolioDocument.js) and the
 * vector PDF generator (public/pdf/portfolio.js). Edit content here; layout
 * lives in each renderer separately since a browser and a PDF page draw very
 * differently.
 */
export default {
  name: 'SUHILMAN',
  eyebrow: '// Portfolio · 2025',
  role: 'Application Developer',
  roleSuffix: 'Full-Stack Dart',
  avatarSrc: 'suhilman.jpg',
  portfolioUrl: 'https://suhilman.github.io/SUHILMANartz/',
  desc: '5+ years shipping digital products across satellite telecommunications, POS, CRM, and internal platforms. Specialized in React, Next.js, Vue.js, Flutter — currently focused on full-stack Dart (Flutter + Frog + PostgreSQL).',

  headMeta: [
    { label: 'Email', value: 'Suhilman.sch@gmail.com' },
    { label: 'Phone', value: '+62 851-7233-5192' },
    { label: 'Site', value: 'suhilman.github.io/SUHILMANartz' },
    { label: 'GitHub', value: 'github.com/Suhilman' },
    { label: 'LinkedIn', value: 'linkedin.com/in/suhilman' },
  ],
  availableStatus: 'Available for new projects',

  highlights: [
    { n: '5+', label: 'Years Experience' },
    { n: '10+', label: 'Projects Shipped' },
    { n: '3', label: 'Industries Served' },
    { n: '24/7', label: 'Used in Production' },
  ],

  projects: [
    {
      glyph: 'NADIA', pin: 'live', pinLabel: '● Live',
      title: 'Network Monitoring System', meta: 'SATRIA-1 HUB · BAKTI · 2024',
      desc: 'Monitoring dashboard for the SATRIA-1 satellite HUB in Jayapura. Integrates FORTIGATE, HUAWEI Core Switch & HPE ProLiant via JWT REST. Used daily by the operations team.',
      tags: ['Next.js', 'MUI', 'REST', 'JWT'],
    },
    {
      glyph: 'VIONA', pin: 'live', pinLabel: '● Live',
      title: 'Multi-HUB NMS Platform', meta: 'Jayapura · Manokwari · Timika',
      desc: 'Network monitoring rolled out across three BAKTI KOMINFO satellite HUBs. Map-based topology, alert routing, unified device status across regions.',
      tags: ['Next.js', 'Google Maps', 'AWS'],
    },
    {
      glyph: 'LOOKUP IP', pin: 'internal', pinLabel: 'Internal',
      title: 'Internal Tools · LNM Module', meta: 'BIS DATA · 2024',
      desc: 'Internal monitoring tools — Landscape Monitoring System module, AWS infrastructure maintenance, bug-fix support across VionaApp.',
      tags: ['React', 'Node.js', 'AWS', 'Maps API'],
    },
    {
      glyph: 'ARTZ HR', pin: 'internal', pinLabel: 'Internal',
      title: 'HR Platform — Full-Stack Dart', meta: 'BIS DATA · 2024',
      desc: 'End-to-end HR platform on full-stack Dart. Attendance, payroll, leave & role-based access — mobile-first for field employees with audit logs.',
      tags: ['Flutter', 'Frog', 'Dart', 'PostgreSQL'],
    },
    {
      glyph: 'BDI Chat', pin: 'internal', pinLabel: 'Internal',
      title: 'Real-Time Messaging + AI', meta: 'BIS DATA · 2024',
      desc: 'Real-time chat with AI assistant. WebSocket transport, PostgreSQL persistence, full-text search, push notifications & offline cache.',
      tags: ['Flutter', 'Frog', 'WebSocket', 'PostgreSQL'],
    },
    {
      glyph: 'ELARA', pin: 'internal', pinLabel: 'Internal',
      title: 'Enterprise AI Chat Assistant', meta: 'BIS DATA · 2025',
      desc: 'Enterprise Logic, Analytics & Responsiveness Assistant — conversational AI for reasoning, drafting, planning and Q&A across text, documents, sheets and slides.',
      tags: ['Next.js', 'AI Chat', 'Markdown'],
    },
    {
      glyph: 'Benggala', pin: 'live', pinLabel: '● Live',
      title: 'Procurement Monitoring · LKPP', meta: 'BIS DATA · 2026',
      desc: 'Real-time monitoring dashboard for Indonesia’s national procurement agency — tracks tender methods, budget allocation and top government work units nationwide.',
      tags: ['Next.js', 'Dashboard', 'REST'],
    },
    {
      glyph: 'BeetPOS', pin: 'shipped', pinLabel: 'Shipped',
      title: 'POS & Clinic Back-Office', meta: 'Life Tech · 2021–2023',
      desc: 'UI/UX & back-office for a multi-tenant POS used by retail and clinics. Marketplace sync with Tokopedia & Shopee, plus QRIS payments.',
      tags: ['React', 'Vue.js', 'Vuetify', 'Figma'],
    },
    {
      glyph: 'CRM MRT', pin: 'shipped', pinLabel: 'Shipped',
      title: 'Customer Relationship Mgmt', meta: 'Life Tech · 2021–2023',
      desc: 'CRM designed and developed from scratch — payment integration, role-based dashboards, and a customer activity timeline.',
      tags: ['Vue.js', 'Vuetify', 'REST API'],
    },
    {
      glyph: 'BeetClinic', pin: 'shipped', pinLabel: 'Shipped',
      title: 'Clinic POS Variant', meta: 'Life Tech · 2021–2023',
      desc: 'POS variant tailored for clinics — appointment, billing & QRIS payment. Co-designed UI/UX and built the front-end.',
      tags: ['Vue.js', 'Vuetify', 'Figma'],
    },
    {
      glyph: 'Cave POS', pin: 'shipped', pinLabel: 'Shipped',
      title: 'Cashier + Real-Time Chat', meta: 'Cave Laundry · 2020–2021',
      desc: 'Cashier app for a laundry chain with real-time WebSocket chat between counter and operations. Low latency, high availability.',
      tags: ['Laravel', 'MySQL', 'jQuery'],
    },
  ],

  // Closing tile in the Featured Work grid — signals more shipped work exists
  // beyond what's individually listed here, instead of a 12th real project card.
  moreProjects: { n: '10+', label: 'More Projects\nBehind the Scenes' },

  coreSkills: [
    { name: 'React / Next.js / Vue.js', pct: 90 },
    { name: 'Dart / Flutter / Frog', pct: 80 },
    { name: 'PostgreSQL / MySQL / MongoDB', pct: 78 },
    { name: 'UI/UX Design (Figma)', pct: 75 },
    { name: 'Laravel / Node.js / PHP', pct: 65 },
  ],

  techStack: [
    'React', 'Next.js', 'Vue.js', 'Flutter', 'Dart', 'Frog', 'JavaScript', 'TypeScript',
    'Node.js', 'Express', 'Laravel', 'PHP', 'Swift',
    'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'MUI', 'Tailwind', 'Vuetify', 'Figma',
    'REST API', 'WebSocket', 'JWT', 'Cloudflare', 'AWS', 'GitHub',
  ],

  contactHeading: [{ text: "Let's build ", grad: false }, { text: 'something', grad: true }, { text: '.', grad: false }],
  contactSub: 'Open to freelance, product roles & collaborations.',
  contact: [
    { label: 'Email', value: 'Suhilman.sch@gmail.com' },
    { label: 'Phone', value: '+62 851-7233-5192' },
    { label: 'LinkedIn', value: 'linkedin.com/in/suhilman' },
    { label: 'GitHub', value: 'github.com/Suhilman' },
    { label: 'Location', value: 'Ciawi, Bogor 16720, Indonesia', span: true },
  ],
};
