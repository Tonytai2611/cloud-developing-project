import React, { useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Clock3,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Music2,
  Youtube,
  ChevronDown,
  ChevronRight,
  CircleHelp
} from 'lucide-react';
import { env } from '../config/env';

const contactInfo = [
  { icon: MapPin, label: 'Address', value: '123 Coffee Street, Brew City, BC 10000' },
  { icon: Phone, label: 'Phone', value: '+84 28 1234 5678', href: 'tel:+842812345678' },
  { icon: Mail, label: 'Email', value: env.contactEmail, href: `mailto:${env.contactEmail}` },
  { icon: Clock3, label: 'Opening Hours', value: 'Mon – Fri: 7:00 AM – 10:00 PM\nSat – Sun: 8:00 AM – 11:00 PM' }
];

const faqs = [
  'How can I make a reservation?',
  'Do you have vegan options?',
  'What are your opening hours?'
];

export default function ContactUs() {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${env.apiBaseUrl}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || data.error || 'Failed to send message');

      toast.success('Message sent successfully!', { description: "We'll get back to you soon" });
      setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
    } catch (error) {
      toast.error('Failed to send message', { description: error.message || 'Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-[#f7fbf9] px-4 pb-16 pt-28 text-[#0b2d42] sm:px-6"
      style={{
        backgroundImage: "url('/background.png')",
        backgroundPosition: 'center top',
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="mx-auto max-w-6xl">
        <section className="mb-9 text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.35em] text-[#008c80]">Get in touch</p>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-[#09273d] sm:text-5xl">Contact Us</h1>
          <p className="mx-auto max-w-2xl text-sm leading-6 text-[#25445c] sm:text-base">
            Have questions or want to make a reservation? We&apos;d love to hear from you.<br className="hidden sm:block" />
            Send us a message and we&apos;ll respond as soon as possible.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[0.9fr_1.5fr]">
          <aside className="rounded-2xl border border-white/90 bg-white/90 p-7 shadow-[0_16px_40px_rgba(25,74,74,0.10)] backdrop-blur sm:p-8">
            <div className="flex items-center gap-4 border-b border-[#dcefea] pb-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#e5f7f2] p-3">
                <img src="/logo.png" alt="BrewCraft logo" className="h-full w-full object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#09273d]">BrewCraft</h2>
                <p className="mt-1 text-sm text-[#3d5d70]">More than coffee. A place to belong.</p>
              </div>
            </div>

            <div className="space-y-6 py-7">
              {contactInfo.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e9f9f5] text-[#087f78]">
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <div className="min-w-0 pt-1">
                    <p className="mb-1 text-sm font-semibold text-[#113c51]">{label}</p>
                    {href ? (
                      <a href={href} className="whitespace-pre-line text-sm leading-5 text-[#155b66] hover:text-[#008c80]">{value}</a>
                    ) : (
                      <p className="whitespace-pre-line text-sm leading-5 text-[#155b66]">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#dcefea] pt-6">
              <p className="mb-4 text-sm font-semibold text-[#113c51]">Follow Us</p>
              <div className="flex gap-3">
                {[Facebook, Instagram, Music2, Youtube].map((Icon, index) => (
                  <a key={index} href={`https://www.example.com/${index}`} aria-label="Social media" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f9f5] text-[#087f78] transition hover:bg-[#0fae9f] hover:text-white">
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>
          </aside>

          <section className="rounded-2xl border border-white/90 bg-white/95 p-7 shadow-[0_16px_40px_rgba(25,74,74,0.10)] backdrop-blur sm:p-8">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e5f7f2] text-[#087f78]"><MessageCircle size={23} /></div>
              <div>
                <h2 className="text-xl font-bold text-[#09273d]">Send us a message</h2>
                <p className="text-sm text-[#557080]">We&apos;ll get back to you within 24 hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-[#174257]">Full Name <span className="text-red-500">*</span>
                  <input name="name" value={formData.name} onChange={handleChange} required placeholder="John Doe" className="mt-2 w-full rounded-lg border border-[#d4e2e6] px-4 py-3 text-sm outline-none transition focus:border-[#0fae9f] focus:ring-2 focus:ring-[#0fae9f]/20" />
                </label>
                <label className="text-sm font-medium text-[#174257]">Phone Number
                  <input name="phone" value={formData.phone} onChange={handleChange} placeholder="+84 90 123 4567" className="mt-2 w-full rounded-lg border border-[#d4e2e6] px-4 py-3 text-sm outline-none transition focus:border-[#0fae9f] focus:ring-2 focus:ring-[#0fae9f]/20" />
                </label>
              </div>
              <label className="block text-sm font-medium text-[#174257]">Email Address <span className="text-red-500">*</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="john@example.com" className="mt-2 w-full rounded-lg border border-[#d4e2e6] px-4 py-3 text-sm outline-none transition focus:border-[#0fae9f] focus:ring-2 focus:ring-[#0fae9f]/20" />
              </label>
              <label className="block text-sm font-medium text-[#174257]">Subject
                <span className="relative mt-2 block"><select name="subject" value={formData.subject} onChange={handleChange} className="w-full appearance-none rounded-lg border border-[#d4e2e6] bg-white px-4 py-3 text-sm outline-none focus:border-[#0fae9f] focus:ring-2 focus:ring-[#0fae9f]/20"><option>General Inquiry</option><option>Reservation</option><option>Menu Question</option><option>Feedback</option></select><ChevronDown size={17} className="pointer-events-none absolute right-4 top-3.5 text-[#087f78]" /></span>
              </label>
              <label className="block text-sm font-medium text-[#174257]">Your Message <span className="text-red-500">*</span>
                <textarea name="message" value={formData.message} onChange={handleChange} required rows="4" maxLength="500" placeholder="Tell us how we can help you..." className="mt-2 w-full resize-none rounded-lg border border-[#d4e2e6] px-4 py-3 text-sm outline-none transition focus:border-[#0fae9f] focus:ring-2 focus:ring-[#0fae9f]/20" />
              </label>
              <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#14b8a6] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#14b8a6]/20 transition hover:bg-[#078f84] disabled:cursor-not-allowed disabled:bg-slate-400">
                {loading ? 'Sending...' : 'Send Message'} {!loading && <Send size={17} />}
              </button>
            </form>
            <p className="mt-4 text-center text-xs text-[#718894]">By submitting this form, you agree to our <a href="/contact-us#privacy" className="text-[#087f78] hover:underline">Privacy Policy</a>.</p>
          </section>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_1fr]">
          <div className="relative flex min-h-[230px] items-end overflow-hidden rounded-2xl border border-white/90 bg-[#dce9e5] p-6 shadow-[0_16px_40px_rgba(25,74,74,0.10)]" style={{ backgroundImage: "linear-gradient(rgba(236,247,244,.55), rgba(236,247,244,.55)), url('/background.png')", backgroundPosition: 'center bottom', backgroundSize: 'cover' }}>
            <div className="relative rounded-xl bg-white/95 px-5 py-4 shadow-md">
              <p className="font-bold text-[#09273d]">BrewCraft</p>
              <p className="text-sm text-[#3d5d70]">123 Coffee Street, Brew City</p>
            </div>
            <MapPin className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 fill-red-500 text-red-600" size={42} />
          </div>

          <div className="rounded-2xl border border-white/90 bg-white/95 p-6 shadow-[0_16px_40px_rgba(25,74,74,0.10)] backdrop-blur sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e5f7f2] text-[#087f78]"><CircleHelp size={20} /></div><div><h2 className="font-bold text-[#09273d]">Frequently Asked Questions</h2><p className="text-xs text-[#557080]">Find quick answers to common questions.</p></div></div>
              <a href="/contact-us" className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-[#087f78] sm:flex">View All FAQs <ArrowRight size={16} /></a>
            </div>
            <div className="space-y-2">{faqs.map((faq) => <a href="/contact-us" key={faq} className="flex items-center justify-between rounded-lg bg-[#f1f8f6] px-4 py-3 text-sm text-[#174257] transition hover:bg-[#e1f2ed]"><span>{faq}</span><ChevronRight size={17} className="text-[#087f78]" /></a>)}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
