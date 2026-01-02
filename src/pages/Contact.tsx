import React, { useState, useEffect } from 'react';
import { ref, push, onValue } from '../config/firebase';
import { database } from '../config/firebase';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { SiteSettings } from '../types';

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
      setFormData({ name: '', email: '', subject: '', message: '' });
      setErrors({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      toast.error('Failed to send message. Please try again.');
      console.error('Error sending contact message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user starts typing
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

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
            Contact <span className="font-medium text-blue-600 dark:text-blue-400">{storeName}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            We're here to help. Send us a message and we'll respond shortly.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-normal text-gray-900 dark:text-gray-100 mb-8">Send a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Name Field */}
                <div className="relative">
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="peer w-full px-0 pt-6 pb-2 bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-transparent"
                    placeholder=" "
                  />
                  <label
                    htmlFor="name"
                    className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:top-6 peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-500"
                  >
                    Full Name *
                  </label>
                  {errors.name && (
                    <p className="absolute text-xs text-red-500 dark:text-red-400 mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email Field */}
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="peer w-full px-0 pt-6 pb-2 bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-transparent"
                    placeholder=" "
                  />
                  <label
                    htmlFor="email"
                    className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:top-6 peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-500"
                  >
                    Email Address *
                  </label>
                  {errors.email && (
                    <p className="absolute text-xs text-red-500 dark:text-red-400 mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Subject Field */}
              <div className="relative">
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="peer w-full px-0 pt-6 pb-2 bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-transparent"
                  placeholder=" "
                />
                <label
                  htmlFor="subject"
                  className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:top-6 peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-500"
                >
                  Subject *
                </label>
                {errors.subject && (
                  <p className="absolute text-xs text-red-500 dark:text-red-400 mt-1">{errors.subject}</p>
                )}
              </div>

              {/* Message Field */}
              <div className="relative">
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleInputChange}
                  className="peer w-full px-0 pt-6 pb-2 bg-transparent border-0 border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:outline-none focus:ring-0 text-gray-900 dark:text-gray-100 placeholder-transparent resize-none"
                  placeholder=" "
                />
                <label
                  htmlFor="message"
                  className="absolute left-0 top-0 text-sm text-gray-500 dark:text-gray-400 transition-all duration-200 peer-placeholder-shown:text-base peer-placeholder-shown:top-6 peer-focus:top-0 peer-focus:text-sm peer-focus:text-blue-500"
                >
                  Message *
                </label>
                {errors.message && (
                  <p className="absolute text-xs text-red-500 dark:text-red-400 mt-1">{errors.message}</p>
                )}
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400">
                * Required fields
              </div>

              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.email.trim() || !formData.subject.trim() || !formData.message.trim()}
                className="w-full py-3 bg-gray-900 dark:bg-gray-800 text-white hover:bg-black dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div>
            <h2 className="text-xl font-normal text-gray-900 dark:text-gray-100 mb-8">Contact Information</h2>
            
            <div className="space-y-10">
              {/* Email */}
              <div className="flex items-start">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mr-4">
                  <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Email</h3>
                  <p className="text-gray-600 dark:text-gray-400">{storeEmail}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mr-4">
                  <Phone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Phone</h3>
                  <p className="text-gray-600 dark:text-gray-400">{primaryPhone}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mr-4">
                  <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Address</h3>
                  {storeAddress.split('\n').map((line, index) => (
                    <p key={index} className="text-gray-600 dark:text-gray-400">
                      {line}
                    </p>
                  ))}
                </div>
              </div>

              {/* Business Hours */}
              <div className="flex items-start">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mr-4">
                  <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">Business Hours</h3>
                  <div className="space-y-1">
                    {storeHours.split('\n').map((segment, idx) => {
                      const [day, time] = segment.split(':');
                      return (
                        <div key={idx} className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{day?.trim()}</span>
                          <span>{time?.trim()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                We typically respond to all inquiries within 24 hours during business days. 
                For urgent matters, please call us directly. We're committed to providing 
                excellent customer service and will get back to you as soon as possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;