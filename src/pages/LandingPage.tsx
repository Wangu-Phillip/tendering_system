import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
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

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navigation */}
      <nav className="bg-primary/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-lg font-bold text-white">
                Procurement System
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() =>
                    link.href.startsWith("#")
                      ? scrollTo(link.href.slice(1))
                      : navigate(link.href)
                  }
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* CTA + Mobile Toggle */}
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="hidden sm:inline-flex text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/login"
                className="bg-secondary text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                Get Started
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
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-primary">
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
        )}
      </nav>

      {/* Hero Section */}
      <section
        id="home"
        className="relative overflow-hidden bg-primary text-white"
      >
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 text-blue-200 text-xs font-medium px-3 py-1.5 rounded-full mb-6 backdrop-blur-sm border border-white/10">
                <Star size={14} className="text-yellow-400" />
                Trusted by 500+ organizations in Botswana
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight mb-6">
                Modern
                <span className="text-blue-400"> Procurement </span>
                Made Simple
              </h1>
              <p className="text-lg text-gray-300 mb-8 max-w-lg leading-relaxed">
                Streamline tender management, bid submissions, and procurement
                workflows with a secure, transparent platform built for
                Botswana's public and private sector.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="bg-secondary text-white px-7 py-3.5 rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2 text-sm"
                >
                  Start Free Today <ArrowRight size={18} />
                </Link>
                <button
                  onClick={() => scrollTo("features")}
                  className="border border-white/20 text-white px-7 py-3.5 rounded-lg hover:bg-white/10 transition-all font-semibold text-sm backdrop-blur-sm"
                >
                  Explore Features
                </button>
              </div>
            </div>

            {/* Hero visual — stats cards */}
            <div className="hidden lg:grid grid-cols-2 gap-4">
              {[
                {
                  icon: FileText,
                  value: "1,000+",
                  label: "Tenders Published",
                  color: "bg-blue-600",
                },
                {
                  icon: Users,
                  value: "500+",
                  label: "Organizations",
                  color: "bg-emerald-600",
                },
                {
                  icon: CheckCircle,
                  value: "10K+",
                  label: "Successful Bids",
                  color: "bg-violet-600",
                },
                {
                  icon: Clock,
                  value: "99.9%",
                  label: "Platform Uptime",
                  color: "bg-amber-600",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
                >
                  <div
                    className={`w-10 h-10 rounded-lg ${stat.color} flex items-center justify-center mb-3`}
                  >
                    <stat.icon size={20} className="text-white" />
                  </div>
                  <p className="text-2xl font-bold mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Bar */}
      <section className="py-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12 text-gray-400">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Trusted by leading organizations
            </span>
            <div className="flex items-center gap-8 sm:gap-12">
              {["Government", "Parastatals", "Private Sector", "NGOs"].map(
                (org) => (
                  <span key={org} className="text-sm font-medium text-gray-400">
                    {org}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-secondary text-sm font-semibold uppercase tracking-widest">
              Features
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-3 mb-4">
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
                color: "bg-blue-50 text-secondary",
              },
              {
                icon: Users,
                title: "Bid Submission",
                desc: "Submit competitive bids securely. Track status, compare offers, and manage the full negotiation lifecycle.",
                color: "bg-emerald-50 text-emerald-600",
              },
              {
                icon: BarChart3,
                title: "Analytics & Reporting",
                desc: "Real-time dashboards, detailed reports, and actionable insights on all procurement activities.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: Shield,
                title: "Security & Compliance",
                desc: "Enterprise-grade encryption, role-based access control, and full audit trails for regulatory compliance.",
                color: "bg-red-50 text-red-500",
              },
              {
                icon: Globe,
                title: "Cloud-Based Access",
                desc: "Access the platform from anywhere, on any device. No installations required — just log in and go.",
                color: "bg-violet-50 text-violet-600",
              },
              {
                icon: FileText,
                title: "Document Management",
                desc: "Upload, organize, and manage all procurement documents securely with version control and easy retrieval.",
                color: "bg-cyan-50 text-cyan-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group p-6 lg:p-8 rounded-xl border border-gray-100 hover:border-secondary/20 hover:shadow-md transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}
                >
                  <feature.icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-primary mb-2">
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

      {/* About Section */}
      <section id="about" className="py-20 lg:py-28 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-secondary text-sm font-semibold uppercase tracking-widest">
                About Us
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-3 mb-6">
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
                ].map((benefit) => (
                  <div key={benefit} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <CheckCircle className="text-success" size={20} />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats block */}
            <div className="grid grid-cols-2 gap-5">
              {[
                {
                  value: "60%",
                  label: "Faster procurement cycles",
                  accent: "text-secondary",
                },
                {
                  value: "500+",
                  label: "Registered organizations",
                  accent: "text-emerald-600",
                },
                {
                  value: "24/7",
                  label: "Platform availability",
                  accent: "text-violet-600",
                },
                {
                  value: "100%",
                  label: "Data security guaranteed",
                  accent: "text-amber-600",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
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

      {/* How It Works */}
      <section id="how-it-works" className="py-20 lg:py-28 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-secondary text-sm font-semibold uppercase tracking-widest">
              How It Works
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary mt-3 mb-4">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              Whether you're a procurement entity or a bidder, getting started
              takes just minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Your Account",
                desc: "Register as a procurement entity or vendor. Complete your profile with your organization's details.",
              },
              {
                step: "02",
                title: "Publish or Browse Tenders",
                desc: "Procurement entities publish tenders while vendors browse and find opportunities that match their capabilities.",
              },
              {
                step: "03",
                title: "Submit & Manage Bids",
                desc: "Vendors submit bids, entities evaluate submissions, and the best vendor is selected — all in one platform.",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative">
                {index < 2 && (
                  <div className="hidden md:block absolute top-12 left-full w-full h-px border-t-2 border-dashed border-gray-200 -translate-x-1/2 z-0" />
                )}
                <div className="relative z-10 text-center">
                  <div className="w-16 h-16 bg-secondary/10 text-secondary rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-bold">
                    {item.step}
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

      {/* Mobile Stats (visible on smaller screens) */}
      <section className="lg:hidden py-16 px-4 bg-gray-50">
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

      {/* CTA Section */}
      <section className="py-20 lg:py-24 px-4 bg-gray-900 relative overflow-hidden">
        <div className="relative max-w-3xl mx-auto text-center text-white">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">
            Ready to Transform Your Procurement?
          </h2>
          <p className="text-gray-300 text-lg mb-8 max-w-xl mx-auto">
            Join hundreds of organizations already streamlining their
            procurement processes with BW Procurement System.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              className="bg-secondary text-white px-8 py-3.5 rounded-lg hover:bg-blue-700 transition-all font-semibold flex items-center justify-center gap-2 text-sm"
            >
              Get Started Free <ChevronRight size={18} />
            </Link>
            <Link
              to="/contact"
              className="border border-white/20 text-white px-8 py-3.5 rounded-lg hover:bg-white/10 transition-all font-semibold text-sm text-center"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Footer */}
          <div className="py-12 lg:py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center mb-4">
                <span className="text-lg font-bold">Procurement System</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
                Modern, secure procurement solutions for public and private
                organizations across Botswana.
              </p>
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
          <div className="border-t border-gray-800 py-6 text-center">
            <p className="text-gray-500 text-sm">
              &copy; 2026 BW Procurement System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
