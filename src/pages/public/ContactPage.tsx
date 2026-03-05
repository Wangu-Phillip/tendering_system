import { Link } from "react-router-dom";
import { useState } from "react";
import { Mail, Phone, MapPin, Send, ArrowLeft } from "lucide-react";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Nav */}
      <nav className="bg-primary border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-secondary text-white rounded-lg flex items-center justify-center font-bold text-sm tracking-tight">
                BW
              </div>
              <span className="text-lg font-bold text-white hidden sm:inline">
                BW Procurement
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft size={16} />
                Back to Home
              </Link>
              <Link
                to="/login"
                className="bg-secondary text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-primary text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Get In Touch</h1>
          <p className="text-gray-300 text-lg">
            Have a question about our platform? Need help getting started? Our
            team is ready to assist you.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 lg:py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-5 gap-10">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-semibold text-primary mb-6">
                Contact Information
              </h2>

              {[
                {
                  icon: Mail,
                  title: "Email Us",
                  detail: "support@bwprocurement.co.bw",
                  sub: "We respond within 24 hours",
                },
                {
                  icon: Phone,
                  title: "Call Us",
                  detail: "+267 3XX XXXX",
                  sub: "Mon–Fri, 8:00 AM – 5:00 PM",
                },
                {
                  icon: MapPin,
                  title: "Visit Us",
                  detail: "Gaborone, Botswana",
                  sub: "Main Mall, Plot 123",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-5 bg-white rounded-xl border border-gray-100"
                >
                  <div className="w-11 h-11 rounded-lg bg-blue-50 text-secondary flex items-center justify-center shrink-0">
                    <item.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary text-sm">
                      {item.title}
                    </h3>
                    <p className="text-secondary text-sm font-medium mt-0.5">
                      {item.detail}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{item.sub}</p>
                  </div>
                </div>
              ))}

              <div className="p-5 bg-white rounded-xl border border-gray-100">
                <h3 className="font-semibold text-primary text-sm mb-2">
                  Office Hours
                </h3>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Monday – Friday: 8:00 AM – 5:00 PM</p>
                  <p>Saturday: 9:00 AM – 1:00 PM</p>
                  <p>Sunday & Public Holidays: Closed</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl border border-gray-100 p-8">
                <h2 className="text-xl font-semibold text-primary mb-1">
                  Send Us a Message
                </h2>
                <p className="text-gray-400 text-sm mb-8">
                  Fill out the form below and we'll get back to you as soon as
                  possible.
                </p>

                {submitted ? (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Send size={24} />
                    </div>
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      Message Sent!
                    </h3>
                    <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
                      Thank you for reaching out. We'll get back to you within
                      24 hours.
                    </p>
                    <button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({
                          name: "",
                          email: "",
                          subject: "",
                          message: "",
                        });
                      }}
                      className="text-secondary text-sm font-medium hover:text-blue-700 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          required
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Your full name"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-1.5"
                        >
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@example.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="subject"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Subject
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="sales">Sales & Pricing</option>
                        <option value="partnership">Partnership</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="block text-sm font-medium text-gray-700 mb-1.5"
                      >
                        Message
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        required
                        rows={5}
                        value={form.message}
                        onChange={handleChange}
                        placeholder="How can we help you?"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full sm:w-auto bg-secondary text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      Send Message <Send size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              &copy; 2026 BW Procurement System. All rights reserved.
            </p>
            <Link
              to="/"
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
