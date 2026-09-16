import React, { useState, useEffect } from 'react';
import { ref, push, onValue } from '../config/firebase';
import { database } from '../config/firebase';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SiteSettings } from '../types';

type Tone = 'sky' | 'gold';

const TONE_CLASSES: Record<Tone, { bg: string; text: string }> = {
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-400/10',
    text: 'text-sky-600 dark:text-sky-400',
  },
  gold: {
    bg: 'bg-amber-50 dark:bg-amber-400/10',
    text: 'text-amber-600 dark:text-amber-400',
  },
};

function BrandMark() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="w-7 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
      <span className="w-3 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
    </div>
  );
}

function IconTile({
  icon: Icon,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
}) {
  const c = TONE_CLASSES[tone];

  return (
    <div
      className={`
        w-11 h-11 rounded-xl ${c.bg}
        flex items-center justify-center shrink-0
      `}
    >
      <Icon className={`w-5 h-5 ${c.text}`} />
    </div>
  );
}

function Surface({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`
        rounded-3xl
        border border-neutral-200/80 dark:border-neutral-800
        bg-white dark:bg-neutral-900/70
        shadow-sm
        ${className}
      `}
    >
      {children}
    </div>
  );
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SiteSettings[]>([]);

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    const settingsRef = ref(database, 'siteSettings');

    const unsubscribe = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        setSettings(list);
      }
    });

    return () => unsubscribe();
  }, []);

  const getSetting = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting?.value || '';
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      subject: '',
      message: '',
    };

    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required';
      isValid = false;
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
      isValid = false;
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fill in all required fields correctly');
      return;
    }

    setLoading(true);

    try {
      const contactRef = ref(database, 'contactMessages');

      await push(contactRef, {
        ...formData,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      toast.success("Message sent successfully! We'll get back to you soon.");

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });

      setErrors({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending contact message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const storeName = getSetting('store_name');
  const storeEmail = getSetting('primary_email');
  const primaryPhone = getSetting('primary_phone');
  const storeAddress = getSetting('store_address');
  const storeHours = getSetting('store_hours');

  const inputBase =
    'peer w-full rounded-xl border bg-neutral-50/70 dark:bg-neutral-950/60 px-4 pt-6 pb-3 text-sm text-neutral-900 dark:text-white placeholder-transparent outline-none transition-all duration-200';

  const inputNormal =
    'border-neutral-200 dark:border-neutral-800 focus:border-sky-400 dark:focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10';

  const inputError =
    'border-red-300 dark:border-red-500/60 focus:border-red-400 focus:ring-4 focus:ring-red-500/10';

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-sky-400/5 blur-3xl" />
        <div className="pointer-events-none absolute top-40 right-0 w-[300px] h-[300px] rounded-full bg-amber-400/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <header className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
            <div className="flex justify-center mb-6">
              <BrandMark />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-neutral-950 dark:text-white">
              Contact{' '}
              <span className="font-normal bg-gradient-to-r from-sky-500 to-sky-600 dark:from-sky-400 dark:to-sky-300 bg-clip-text text-transparent">
                {storeName}
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-8">
              We're here to help. Send us a message and we'll respond shortly.
            </p>
          </header>

          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 lg:gap-8 items-start">
            <Surface className="p-6 sm:p-8 lg:p-10">
              <div className="flex items-start justify-between gap-4 mb-8">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400 mb-2">
                    Get in touch
                  </p>

                  <h2 className="text-2xl font-light text-neutral-950 dark:text-white">
                    Send a Message
                  </h2>

                  <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Tell us how we can help.
                  </p>
                </div>

                <div className="hidden sm:flex w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-400/10 items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`${inputBase} ${
                        errors.name ? inputError : inputNormal
                      }`}
                      placeholder=" "
                    />

                    <label
                      htmlFor="name"
                      className="absolute left-4 top-2 text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-sky-500 dark:peer-focus:text-sky-400"
                    >
                      Full Name *
                    </label>

                    {errors.name && (
                      <p className="mt-1.5 px-1 text-xs text-red-500 dark:text-red-400">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${inputBase} ${
                        errors.email ? inputError : inputNormal
                      }`}
                      placeholder=" "
                    />

                    <label
                      htmlFor="email"
                      className="absolute left-4 top-2 text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-sky-500 dark:peer-focus:text-sky-400"
                    >
                      Email Address *
                    </label>

                    {errors.email && (
                      <p className="mt-1.5 px-1 text-xs text-red-500 dark:text-red-400">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={`${inputBase} ${
                      errors.subject ? inputError : inputNormal
                    }`}
                    placeholder=" "
                  />

                  <label
                    htmlFor="subject"
                    className="absolute left-4 top-2 text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-sky-500 dark:peer-focus:text-sky-400"
                  >
                    Subject *
                  </label>

                  {errors.subject && (
                    <p className="mt-1.5 px-1 text-xs text-red-500 dark:text-red-400">
                      {errors.subject}
                    </p>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleInputChange}
                    className={`${inputBase} ${
                      errors.message ? inputError : inputNormal
                    } resize-none`}
                    placeholder=" "
                  />

                  <label
                    htmlFor="message"
                    className="absolute left-4 top-2 text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[11px] peer-focus:text-sky-500 dark:peer-focus:text-sky-400"
                  >
                    Message *
                  </label>

                  {errors.message && (
                    <p className="mt-1.5 px-1 text-xs text-red-500 dark:text-red-400">
                      {errors.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    * Required fields
                  </p>

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      !formData.name.trim() ||
                      !formData.email.trim() ||
                      !formData.subject.trim() ||
                      !formData.message.trim()
                    }
                    className="
                      w-full sm:w-auto min-w-[170px]
                      px-6 py-3.5
                      rounded-xl
                      bg-sky-500 hover:bg-sky-600
                      dark:bg-sky-500 dark:hover:bg-sky-400
                      text-white dark:text-neutral-950
                      font-medium text-sm
                      shadow-sm shadow-sky-500/20
                      hover:shadow-md hover:shadow-sky-500/20
                      transition-all duration-200
                      disabled:opacity-40
                      disabled:cursor-not-allowed
                      disabled:hover:bg-sky-500
                      flex items-center justify-center gap-2
                    "
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </Surface>

            <div className="space-y-6">
              <Surface className="p-6 sm:p-8">
                <div className="mb-8">
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400 mb-2">
                    Contact details
                  </p>

                  <h2 className="text-2xl font-light text-neutral-950 dark:text-white">
                    Contact Information
                  </h2>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                    <IconTile icon={Mail} tone="sky" />

                    <div className="min-w-0 pt-0.5">
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                        Email
                      </p>

                      <p className="text-sm text-neutral-700 dark:text-neutral-300 break-all">
                        {storeEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                    <IconTile icon={Phone} tone="gold" />

                    <div className="pt-0.5">
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                        Phone
                      </p>

                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {primaryPhone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                    <IconTile icon={MapPin} tone="sky" />

                    <div className="pt-0.5">
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                        Address
                      </p>

                      <div className="space-y-0.5">
                        {storeAddress.split('\n').map((line, index) => (
                          <p
                            key={index}
                            className="text-sm text-neutral-700 dark:text-neutral-300"
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                    <IconTile icon={Clock} tone="gold" />

                    <div className="pt-0.5 flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">
                        Business Hours
                      </p>

                      <div className="space-y-1.5">
                        {storeHours.split('\n').map((segment, idx) => {
                          const separatorIndex = segment.indexOf(':');

                          const day =
                            separatorIndex >= 0
                              ? segment.slice(0, separatorIndex)
                              : segment;

                          const time =
                            separatorIndex >= 0
                              ? segment.slice(separatorIndex + 1)
                              : '';

                          return (
                            <div
                              key={idx}
                              className="flex justify-between gap-4 text-sm text-neutral-600 dark:text-neutral-400"
                            >
                              <span>{day?.trim()}</span>
                              <span className="text-right">
                                {time?.trim()}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </Surface>

              <div className="rounded-3xl border border-sky-100 dark:border-sky-900/50 bg-sky-50/70 dark:bg-sky-950/20 p-6 sm:p-7">
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-white dark:bg-neutral-900 flex items-center justify-center shrink-0 shadow-sm">
                    <Mail className="w-4 h-4 text-sky-500 dark:text-sky-400" />
                  </div>

                  <p className="text-sm text-sky-900/70 dark:text-sky-100/70 leading-6">
                    We typically respond to all inquiries within 24 hours
                    during business days. For urgent matters, please call us
                    directly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
            <BrandMark />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
