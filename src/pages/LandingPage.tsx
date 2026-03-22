import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  CheckCircle,
  BarChart3,
  Shield,
  Zap,
  Users,
  Globe,
  Clock,
  FileText,
  Menu,
  X,
  ChevronRight,
  Star,
  Quote,
  TrendingUp,
  Award,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "About", href: "#about" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Contact", href: "/contact" },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

/* Intersection Observer hook for scroll-triggered animations */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const featuresView = useInView();
  const aboutView = useInView();
  const stepsView = useInView();
  const testimonialsView = useInView();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* ─── Navigation ─── */}
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-primary/98 backdrop-blur-lg shadow-lg shadow-black/10"
            : "bg-primary/95 backdrop-blur-md"
        } border-b border-white/10`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                <FileText size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                BW Procurement
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() =>
                    link.href.startsWith("#")
                      ? scrollTo(link.href.slice(1))
                      : navigate(link.href)
                  }
                  className="relative text-sm font-medium text-gray-300 hover:text-white transition-colors after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 hover:after:w-full after:bg-secondary after:transition-all after:duration-300"
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="group bg-secondary text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-all text-sm font-semibold flex items-center gap-1.5"
              >
                Get Started
                <ArrowRight
                  size={15}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </Link>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-300 hover:text-white"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? "max-h-80 border-t border-white/10" : "max-h-0"
          } bg-primary`}
        >
          <div className="px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => {
                  if (link.href.startsWith("#")) {
                    scrollTo(link.href.slice(1));
                  } else {
                    navigate(link.href);
                  }
                  setMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Link
              to="/login"
              className="block px-3 py-2.5 text-sm font-medium text-gray-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero Section ─── */}
      <section
        id="home"
        className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary to-gray-800 text-white"
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl" />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-medium px-4 py-2 rounded-full mb-8 backdrop-blur-sm border border-white/10">
                <Star size={14} className="text-yellow-400" />
                Trusted by 500+ organizations in Botswana
                <ChevronRight size={14} className="text-blue-300" />
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                Modern
                <span className="text-gradient"> Procurement </span>
                <br />
                Made Simple
              </h1>
              <p className="text-lg text-gray-300 mb-10 max-w-lg leading-relaxed">
                Streamline tender management, bid submissions, and procurement
                workflows with a secure, transparent platform built for
                Botswana&apos;s public and private sector.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="group bg-secondary text-white px-8 py-4 rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold flex items-center justify-center gap-2.5 text-sm"
                >
                  Start Free Today
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </Link>
                <button
                  onClick={() => scrollTo("features")}
                  className="border border-white/20 text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all font-semibold text-sm backdrop-blur-sm"
                >
                  Explore Features
                </button>
              </div>

              {/* Social proof mini-row */}
              <div className="mt-10 flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[
                    "bg-blue-500",
                    "bg-emerald-500",
                    "bg-violet-500",
                    "bg-amber-500",
                  ].map((bg, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full ${bg} border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold text-white`}
                    >
                      {["JM", "TK", "NB", "SM"][i]}
                    </div>
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} fill="currentColor" />
                    ))}
                  </div>
                  <span className="text-gray-400 text-xs">
                    Rated 4.9/5 from 200+ reviews
                  </span>
                </div>
              </div>
            </div>

            {/* Hero visual — stats cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                {
                  icon: FileText,
                  value: "1,000+",
                  label: "Tenders Published",
                  color: "bg-blue-500/20",
                  iconColor: "text-blue-400",
                  delay: "delay-100",
                },
                {
                  icon: Users,
                  value: "500+",
                  label: "Organizations",
                  color: "bg-emerald-500/20",
                  iconColor: "text-emerald-400",
                  delay: "delay-200",
                },
                {
                  icon: CheckCircle,
                  value: "10K+",
                  label: "Successful Bids",
                  color: "bg-violet-500/20",
                  iconColor: "text-violet-400",
                  delay: "delay-300",
                },
                {
                  icon: Clock,
                  value: "99.9%",
                  label: "Platform Uptime",
                  color: "bg-amber-500/20",
                  iconColor: "text-amber-400",
                  delay: "delay-400",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={`glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 hover:scale-[1.03] animate-fade-in-up ${stat.delay}`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl ${stat.color} flex items-center justify-center mb-4`}
                  >
                    <stat.icon size={22} className={stat.iconColor} />
                  </div>
                  <p className="text-3xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Curved divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 56" fill="none" className="w-full">
            <path
              d="M0 56h1440V28C1280 4 1160 0 720 24S160 52 0 28v28Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ─── Trusted By Bar ─── */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
              Trusted by leading organizations
            </span>
            <div className="flex items-center gap-8 sm:gap-14">
              {[
                { name: "Government", icon: Shield },
                { name: "Parastatals", icon: Award },
                { name: "Private Sector", icon: TrendingUp },
                { name: "NGOs", icon: Globe },
              ].map((org) => (
                <div
                  key={org.name}
                  className="flex items-center gap-2 text-gray-300 hover:text-gray-500 transition-colors"
                >
                  <org.icon size={18} />
                  <span className="text-sm font-medium hidden sm:inline">
                    {org.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-20 lg:py-28 px-4 bg-white">
        <div className="max-w-7xl mx-auto" ref={featuresView.ref}>
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              featuresView.isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-block text-secondary text-sm font-semibold uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-5 mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              A comprehensive suite of tools designed to make procurement
              efficient, transparent, and compliant.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Zap,
                title: "Tender Management",
                desc: "Create, publish, and manage tender opportunities. Set deadlines, specifications, and requirements in one place.",
                gradient: "from-blue-500 to-blue-600",
                bg: "bg-blue-50",
              },
              {
                icon: Users,
                title: "Bid Submission",
                desc: "Submit competitive bids securely. Track status, compare offers, and manage the full negotiation lifecycle.",
                gradient: "from-emerald-500 to-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reporting",
                desc: "Real-time dashboards, detailed reports, and actionable insights on all procurement activities.",
                gradient: "from-amber-500 to-amber-600",
                bg: "bg-amber-50",
              },
              {
                icon: Shield,
                title: "Security & Compliance",
                desc: "Enterprise-grade encryption, role-based access control, and full audit trails for regulatory compliance.",
                gradient: "from-red-500 to-red-600",
                bg: "bg-red-50",
              },
              {
                icon: Globe,
                title: "Cloud-Based Access",
                desc: "Access the platform from anywhere, on any device. No installations required — just log in and go.",
                gradient: "from-violet-500 to-violet-600",
                bg: "bg-violet-50",
              },
              {
                icon: FileText,
                title: "Document Management",
                desc: "Upload, organize, and manage all procurement documents securely with version control and easy retrieval.",
                gradient: "from-cyan-500 to-cyan-600",
                bg: "bg-cyan-50",
              },
            ].map((feature, i) => (
              <div
                key={feature.title}
                className={`card-lift group p-6 lg:p-8 rounded-2xl border border-gray-100 bg-white transition-all duration-500 ${
                  featuresView.isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: featuresView.isVisible
                    ? `${i * 100}ms`
                    : "0ms",
                }}
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center opacity-0 group-hover:opacity-100 absolute transition-opacity duration-300`}
                  >
                    <feature.icon size={24} className="text-white" />
                  </div>
                  <feature.icon
                    size={24}
                    className="text-gray-600 group-hover:opacity-0 transition-opacity duration-300"
                  />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2 group-hover:text-secondary transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── About Section ─── */}
      <section id="about" className="py-20 lg:py-28 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto" ref={aboutView.ref}>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div
              className={`transition-all duration-700 ${
                aboutView.isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-8"
              }`}
            >
              <span className="inline-block text-secondary text-sm font-semibold uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full">
                About Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-5 mb-6">
                Empowering Transparent Procurement in Botswana
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                BW Procurement System was built to modernize how organizations
                manage tenders and bids. We believe procurement should be
                transparent, efficient, and accessible to everyone — from
                government agencies to small businesses.
              </p>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Our platform is designed with security and compliance at its
                core, giving you the confidence to manage high-value procurement
                processes with full accountability and traceability.
              </p>

              <div className="space-y-4">
                {[
                  "Reduce procurement cycle time by up to 60%",
                  "Transparent and fair vendor selection",
                  "Real-time collaboration across teams",
                  "Complete audit trails for compliance",
                  "Accessible from any device, anywhere",
                ].map((benefit, i) => (
                  <div
                    key={benefit}
                    className={`flex items-start gap-3 transition-all duration-500 ${
                      aboutView.isVisible
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-4"
                    }`}
                    style={{
                      transitionDelay: aboutView.isVisible
                        ? `${300 + i * 80}ms`
                        : "0ms",
                    }}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      <CheckCircle className="text-success" size={20} />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats block */}
            <div
              className={`grid grid-cols-2 gap-5 transition-all duration-700 delay-200 ${
                aboutView.isVisible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 translate-x-8"
              }`}
            >
              {[
                {
                  value: "60%",
                  label: "Faster procurement cycles",
                  accent: "text-secondary",
                  bg: "bg-blue-50",
                },
                {
                  value: "500+",
                  label: "Registered organizations",
                  accent: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  value: "24/7",
                  label: "Platform availability",
                  accent: "text-violet-600",
                  bg: "bg-violet-50",
                },
                {
                  value: "100%",
                  label: "Data security guaranteed",
                  accent: "text-amber-600",
                  bg: "bg-amber-50",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="card-lift bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"
                >
                  <p className={`text-3xl font-bold ${stat.accent} mb-2`}>
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 lg:py-28 px-4 bg-white">
        <div className="max-w-7xl mx-auto" ref={stepsView.ref}>
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              stepsView.isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-block text-secondary text-sm font-semibold uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-5 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Whether you&apos;re a procurement entity or a bidder, getting
              started takes just minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-[52px] left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-200" />

            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Register as a procurement entity or vendor. Complete your profile with your organization's details.",
                icon: Users,
              },
              {
                step: "02",
                title: "Publish or Browse Tenders",
                desc: "Procurement entities publish tenders while vendors browse and find opportunities that match their capabilities.",
                icon: FileText,
              },
              {
                step: "03",
                title: "Submit & Manage Bids",
                desc: "Vendors submit bids, entities evaluate submissions, and the best vendor is selected — all in one platform.",
                icon: CheckCircle,
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className={`relative text-center transition-all duration-700 ${
                  stepsView.isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: stepsView.isVisible
                    ? `${index * 150}ms`
                    : "0ms",
                }}
              >
                <div className="relative z-10">
                  <div className="w-[104px] h-[104px] mx-auto mb-6 relative">
                    <div className="absolute inset-0 bg-secondary/10 rounded-3xl rotate-6" />
                    <div className="relative w-full h-full bg-white rounded-3xl border-2 border-secondary/20 flex flex-col items-center justify-center shadow-sm">
                      <item.icon size={28} className="text-secondary mb-1" />
                      <span className="text-xs font-bold text-secondary/60">
                        STEP {item.step}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 lg:py-28 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto" ref={testimonialsView.ref}>
          <div
            className={`text-center mb-16 transition-all duration-700 ${
              testimonialsView.isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-8"
            }`}
          >
            <span className="inline-block text-secondary text-sm font-semibold uppercase tracking-widest bg-blue-50 px-4 py-1.5 rounded-full">
              Testimonials
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-5 mb-4">
              What Our Users Say
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Hear from organizations that have transformed their procurement
              processes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                quote:
                  "BW Procurement System has cut our tender processing time in half. The transparency and ease of use are unmatched.",
                name: "Keletso Mosweu",
                role: "Procurement Director",
                org: "Ministry of Finance",
                avatar: "KM",
                avatarBg: "bg-blue-500",
              },
              {
                quote:
                  "As a vendor, finding and bidding on tenders used to be a nightmare. This platform makes it seamless and fair for everyone.",
                name: "Thabo Kgosidintsi",
                role: "Managing Director",
                org: "Kgosidintsi Construction",
                avatar: "TK",
                avatarBg: "bg-emerald-500",
              },
              {
                quote:
                  "The analytics and audit trail features give us complete confidence in our procurement decisions. Highly recommended.",
                name: "Neo Baitsile",
                role: "Chief Operations Officer",
                org: "Botswana Power Corp",
                avatar: "NB",
                avatarBg: "bg-violet-500",
              },
            ].map((t, i) => (
              <div
                key={t.name}
                className={`card-lift bg-white rounded-2xl p-6 lg:p-8 border border-gray-100 relative transition-all duration-700 ${
                  testimonialsView.isVisible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-8"
                }`}
                style={{
                  transitionDelay: testimonialsView.isVisible
                    ? `${i * 120}ms`
                    : "0ms",
                }}
              >
                <Quote
                  size={32}
                  className="text-secondary/10 absolute top-6 right-6"
                />
                <div className="flex gap-1 mb-4 text-yellow-400">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={14} fill="currentColor" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div
                    className={`w-10 h-10 rounded-full ${t.avatarBg} flex items-center justify-center text-white text-xs font-bold`}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">
                      {t.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {t.role}, {t.org}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Mobile Stats ─── */}
      <section className="lg:hidden py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 gap-6 text-center">
            {[
              { value: "1,000+", label: "Tenders Published" },
              { value: "500+", label: "Organizations" },
              { value: "10K+", label: "Successful Bids" },
              { value: "99.9%", label: "Platform Uptime" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-secondary mb-1">
                  {stat.value}
                </p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 lg:py-28 px-4 relative overflow-hidden bg-gradient-to-br from-gray-900 via-primary to-gray-800">
        {/* Decorative background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-medium px-4 py-2 rounded-full mb-6 backdrop-blur-sm border border-white/10">
            <Zap size={14} className="text-yellow-400" />
            No credit card required
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight">
            Ready to Transform
            <br />
            Your Procurement?
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-xl mx-auto">
            Join hundreds of organizations already streamlining their
            procurement processes with BW Procurement System.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/login"
              className="group bg-secondary text-white px-8 py-4 rounded-xl hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25 transition-all font-semibold flex items-center justify-center gap-2.5 text-sm"
            >
              Get Started Free
              <ChevronRight
                size={18}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <Link
              to="/contact"
              className="border border-white/20 text-white px-8 py-4 rounded-xl hover:bg-white/10 transition-all font-semibold text-sm text-center"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer */}
          <div className="py-12 lg:py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <FileText size={16} className="text-white" />
                </div>
                <span className="text-lg font-bold">BW Procurement</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs mb-5">
                Modern, secure procurement solutions for public and private
                organizations across Botswana.
              </p>
              <div className="flex gap-3">
                {["X", "Li", "Fb"].map((social) => (
                  <div
                    key={social}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {social}
                  </div>
                ))}
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">
                Platform
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Features", action: () => scrollTo("features") },
                  {
                    label: "How It Works",
                    action: () => scrollTo("how-it-works"),
                  },
                  { label: "Security", action: () => scrollTo("features") },
                  { label: "Pricing", action: () => {} },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">
                Company
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: "About", action: () => scrollTo("about") },
                  { label: "Contact", action: () => navigate("/contact") },
                  { label: "Careers", action: () => {} },
                  { label: "Blog", action: () => {} },
                ].map((item) => (
                  <li key={item.label}>
                    <button
                      onClick={item.action}
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-semibold text-sm uppercase tracking-wider text-gray-300 mb-4">
                Legal
              </h4>
              <ul className="space-y-2.5">
                {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
                  (item) => (
                    <li key={item}>
                      <button className="text-sm text-gray-400 hover:text-white transition-colors">
                        {item}
                      </button>
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              &copy; 2026 BW Procurement System. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              {["Privacy", "Terms", "Cookies"].map((item) => (
                <button
                  key={item}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
