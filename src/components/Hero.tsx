// src/components/Hero.tsx
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ShoppingBag,
  Users,
  Award,
  Shield,
  Ruler,
  Phone,
  Quote,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "../hooks/useSiteSettings";

const Hero: React.FC = () => {
  const { settings, get } = useSiteSettings();
  const [activeFeature, setActiveFeature] = useState(0);

  const loading = settings === null;

  const heading = get("site_title") || "Premium Blinds & Mosquito Nets";
  const tagline =
    get("site_description") || "Custom fittings • Quality materials • Expert installation";

  const badges = [
    { label: "500+ Happy Clients", icon: Users },
    { label: "1k+ Installations", icon: Award },
    { label: "5-Year Warranty", icon: Shield },
    { label: "Free Measurement", icon: Ruler },
  ];

  const features = [
    {
      title: "Custom Sizing",
      description: "Perfect fit for any window or door",
      icon: Ruler,
    },
    {
      title: "Quality Materials",
      description: "Durable, UV-resistant options",
      icon: Shield,
    },
    {
      title: "Quick Installation",
      description: "Professional setup within 24 hours",
      icon: Award,
    },
    {
      title: "Easy Maintenance",
      description: "Designed for easy cleaning",
      icon: Users,
    },
  ];

  const productImages = [
    {
      url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      title: "Roller Blinds"
    },
    {
      url: "https://media.istockphoto.com/id/1167452861/photo/open-mosquito-net-wire-screen-on-house-window-protection-against-insect.jpg?s=612x612&w=0&k=20&c=paJ7XM1JBbRouSSKZY56hgY7r7R2m__X8ykRMCyepn8=",
      title: "Mosquito Nets"
    },
  ];

  const words = heading.split(" ");
  const halfIdx = Math.ceil(words.length / 2);
  const firstHalf = words.slice(0, halfIdx).join(" ");
  const secondHalf = words.slice(halfIdx).join(" ");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [features.length]);

  // Minimal animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100
      }
    }
  };

  const imageVariants = {
    hidden: { scale: 0.95, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 100
      }
    }
  };

  return (
    <section className="relative bg-white dark:bg-slate-900 overflow-hidden min-h-screen flex items-center transition-colors duration-300">
      {/* Simplified background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-900/50 z-0" />

      {/* Minimal decorative elements */}
      <motion.div
        className="absolute top-10 right-10 w-64 h-64 bg-blue-100/40 dark:bg-blue-900/20 rounded-full filter blur-3xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      />

      {/* Main container */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 lg:px-8 py-12 md:py-16 w-full">
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* LEFT COLUMN */}
          <div className="text-center lg:text-left space-y-8">
            {loading ? (
              <div className="animate-pulse space-y-6">
                <div className="h-12 md:h-14 bg-slate-300 dark:bg-slate-700 rounded w-3/4 mx-auto lg:mx-0" />
                <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded w-1/2 mx-auto lg:mx-0" />
              </div>
            ) : (
              <>
                <motion.div variants={itemVariants} className="space-y-4">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-slate-800 dark:text-white tracking-tight">
                    <span className="block">{firstHalf}</span>
                    <span className="block bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
                      {secondHalf}
                    </span>
                  </h1>

                  <p className="text-xl text-slate-600 dark:text-slate-300 max-w-md mx-auto lg:mx-0 font-normal leading-relaxed">
                    {tagline}
                  </p>
                </motion.div>

                {/* Buttons */}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mt-8"
                >
                  <motion.a
                    href="/estimate"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center px-6 py-4 font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 text-base shadow-md dark:shadow-blue-900/30"
                  >
                    <Quote className="mr-3 h-5 w-5" />
                    Free Quote
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </motion.a>

                  <motion.a
                    href="/catalogue"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center justify-center px-6 py-4 font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 text-base"
                  >
                    <ShoppingBag className="mr-3 h-5 w-5" />
                    Browse Products
                  </motion.a>
                </motion.div>

                {/* Call to action */}
                <motion.div
                  variants={itemVariants}
                  className="flex justify-center lg:justify-start mt-4"
                >
                  <motion.a
                    href="tel:+91 9738101408"
                    whileHover={{ scale: 1.02 }}
                    className="inline-flex items-center justify-center px-5 py-3 font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-sm"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call Now
                  </motion.a>
                </motion.div>

                {/* Badges - Simplified */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-2 gap-3 mt-8"
                >
                  {badges.map(({ label, icon: Icon }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 + i * 0.1 }}
                      className="flex items-center space-x-2 p-3 bg-white/80 dark:bg-slate-800/80 rounded-lg backdrop-blur-sm border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                        <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          </div>

          {/* RIGHT COLUMN - Simplified Product Showcase */}
          <motion.div className="relative">
            <div className="grid grid-cols-2 gap-4 aspect-square max-w-md mx-auto lg:max-w-none">
              {/* Main image */}
              <motion.div
                className="relative col-span-2 rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700"
                variants={imageVariants}
                whileHover={{ scale: 1.01 }}
              >
                <img
                  src={productImages[0].url}
                  alt={productImages[0].title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <Sparkles className="text-yellow-400" size={20} />
                </div>
              </motion.div>

              {/* Secondary image */}
              <motion.div
                className="relative rounded-lg overflow-hidden shadow-md border border-slate-200 dark:border-slate-700"
                variants={imageVariants}
                whileHover={{ scale: 1.02 }}
              >
                <img
                  src={productImages[1].url}
                  alt={productImages[1].title}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Floating feature card */}
              <motion.div
                className="relative bg-white dark:bg-slate-800 p-4 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
                variants={imageVariants}
                whileHover={{ y: -2 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeFeature}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start space-x-3"
                  >
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      {React.createElement(features[activeFeature].icon, {
                        className: "w-4 h-4 text-blue-600 dark:text-blue-400"
                      })}
                    </div>
                    <div>
                      <h4 className="text-slate-800 dark:text-white font-semibold text-sm">{features[activeFeature].title}</h4>
                      <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">{features[activeFeature].description}</p>
                    </div>
                  </motion.div>
                </AnimatePresence>
                <div className="flex justify-center mt-3">
                  {features.map((_, index) => (
                    <button
                      key={index}
                      className={`w-1.5 h-1.5 rounded-full mx-1 transition-all duration-300 ${index === activeFeature ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                      onClick={() => setActiveFeature(index)}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
