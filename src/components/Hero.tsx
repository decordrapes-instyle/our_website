import React, { useState, useEffect, useRef } from "react";
import {
  ArrowRight,
  ShoppingBag,
  CheckCircle,
  Shield,
  Ruler,
  Phone,
  Quote,
  Star,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSiteSettings } from "../hooks/useSiteSettings";
import { LucideIcon } from "lucide-react";

type Stat = {
  value: string;
  label: string;
  icon: LucideIcon;
};

const Hero: React.FC = () => {
  const { get } = useSiteSettings();
  const [activeSlide, setActiveSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const phoneNumber = get("phone_number") || "+91 9738101408";

  const stats: Stat[] = [
    { value: "500+", label: "Happy Clients", icon: Users },
    { value: "24h", label: "Installation", icon: Zap },
    { value: "5 Years", label: "Warranty", icon: ShieldCheck },
    { value: "4.9", label: "Rating", icon: Star },
  ];

  const slides = [
  // --- Existing Slides ---
  {
    id: 1,
    title: "Roman Blinds",
    description: "Soft fabric folds that add a touch of luxury",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767270492/zw6pc4fsrv98t4fjntys.jpg",
    features: ["Luxurious Fabrics", "Soft Folding", "Decorative"],
  },
  {
    id: 8,
    title: "Roller Blinds",
    description: "Perfect light control with premium fabrics",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767269264/bcud3mvinhivmzrv7coe.png",
    features: ["UV Protection", "Remote Control", "Child Safe"],
  },
  {
    id: 2,
    title: "Mosquito Nets",
    description: "Invisible protection with fine mesh",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767268989/pypqcng5sw8djzhqi3b4.png",
    features: ["Fine Mesh", "Easy Cleaning", "Custom Fit"],
  },
  {
    id: 3,
    title: "Vertical Blinds",
    description: "Elegant solutions for large windows",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767269109/gxgkhkkm4hnstvspltw0.webp",
    features: ["Space Saving", "Easy Control", "Elegant Look"],
  },

  // --- New Additions ---
  {
    id: 4,
    title: "PVC Blinds",
    description: "Durable and moisture-resistant, ideal for wet areas",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767270197/tkxs6xz4acdxnmsen5c3.webp",
    features: ["Waterproof", "Easy Wipe", "Mold Resistant"],
  },
  {
    id: 5,
    title: "Honeycomb Blinds",
    description: "Cellular design for superior thermal insulation",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767270265/qzw3ekzfxist3ha95vwc.webp",
    features: ["Energy Saving", "Sound Absorbing", "Blackout Options"],
  },
  {
    id: 6,
    title: "Skylight Blinds",
    description: "Specialized control for roof windows and attics",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767270364/z8l7k6pnvrpk0vpogmx3.jpg",
    features: ["Thermal Comfort", "Perfect Fit", "Glare Reduction"],
  },
  {
    id: 7,
    title: "Wooden Blinds",
    description: "Classic natural wood for a warm, timeless aesthetic",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767270441/kdzirwynfuximtoe86nc.jpg",
    features: ["Real Wood", "Natural Grain", "Robust Slats"],
  },
  {
    id: 9,
    title: "Zebra Blinds",
    description: "Alternating sheer and solid stripes for modern light control",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767270549/nklwzx0njrpw80jcjsid.jpg",
    features: ["Day & Night", "Dual Layer", "Modern Style"],
  },
  {
    id: 10,
    title: "Motorised Solutions",
    description: "Smart automation for effortless convenience",
    image: "https://res.cloudinary.com/ds6um53cx/image/upload/v1767270613/kp8itms81vb0pmtoksux.jpg",
    features: ["Voice Control", "App Enabled", "Scheduling"],
  },
];

  const benefits = [
    {
      icon: Ruler,
      text: "Free Measurement",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      icon: CheckCircle,
      text: "Certified Quality",
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      icon: Clock,
      text: "Fast Installation",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      icon: Shield,
      text: "5-Year Warranty",
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  const nextSlide = () => {
    setActiveSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, []);

  const fadeInUp = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 100,
      },
    },
  } as any;

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.05,
      },
    },
  } as any;

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen bg-white dark:bg-neutral-950 overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-5 dark:opacity-[0.03]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.1)_1px,transparent_0)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10">
        {/* Main Content */}
        <div className="container mx-auto px-4 pt-8 sm:pt-16 pb-20">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 mb-6"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Trusted by 500+ Homes & Offices
            </span>
          </motion.div>

          {/* Updated Layout: Stack vertically on mobile, grid on desktop */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Content - Now comes first on mobile */}
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="w-full lg:order-1"
            >
              {/* Heading Hierarchy */}
              <div className="mb-6">
                <motion.span
                  variants={fadeInUp}
                  className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium mb-4"
                >
                  Decor Drapes Instyle
                </motion.span>

                <motion.h1
                  variants={fadeInUp}
                  className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
                >
                  <span className="block text-neutral-900 dark:text-white">
                    Transform Your
                  </span>
                  <span className="block text-neutral-800 dark:text-neutral-200">
                    Living Space
                  </span>
                </motion.h1>

                <motion.p
                  variants={fadeInUp}
                  className="text-base sm:text-lg md:text-xl
           text-neutral-600 dark:text-neutral-400
           leading-relaxed
           max-w-2xl
           mb-8"
                >
                  Custom blinds & mosquito nets with precise measurement, expert
                  installation, and comprehensive{" "}
                  <span className="font-semibold text-neutral-800 dark:text-neutral-300">
                    5-year warranty
                  </span>
                  .
                </motion.p>
              </div>

              {/* Infinite Horizontal Scroll Badges */}
              <div className="relative mb-8 overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white dark:from-neutral-950 to-transparent z-10" />
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white dark:from-neutral-950 to-transparent z-10" />

                <motion.div
                  variants={fadeInUp}
                  className="flex gap-3 animate-scroll-horizontal hover:pause-scroll"
                  style={{ width: "max-content" }}
                >
                  {/* Benefits */}
                  {[...benefits, ...benefits].map((item, index) => (
                    <div
                      key={`benefit-${index}`}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium min-w-max ${item.bgColor} ${item.color}`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.text}</span>
                    </div>
                  ))}

                  {/* Stats */}
                  {[...stats, ...stats].map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <div
                        key={`stat-${index}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold min-w-max
            ${
              index % 4 === 0
                ? "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400"
                : ""
            }
            ${
              index % 4 === 1
                ? "bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-400"
                : ""
            }
            ${
              index % 4 === 2
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
                : ""
            }
            ${
              index % 4 === 3
                ? "bg-teal-100 text-teal-600 dark:bg-teal-900 dark:text-teal-400"
                : ""
            }
          `}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="whitespace-nowrap">
                          {item.value} {item.label}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Scroll animation */}
              <style>{`
  @keyframes scroll-horizontal {
    0% { transform: translateX(0%); }
    100% { transform: translateX(-50%); }
  }

  .animate-scroll-horizontal {
    animation: scroll-horizontal 40s linear infinite;
  }

  .hover\\:pause-scroll:hover {
    animation-play-state: paused;
  }
`}</style>

              {/* CTA Buttons - Not full width */}
              <motion.div
                variants={fadeInUp}
                className="flex flex-wrap gap-3 justify-start"
              >
                <motion.a
                  href="/estimate"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-semibold rounded-full hover:shadow-lg transition-all duration-200"
                >
                  <Quote className="w-4 h-4" />
                  <span>Get Free Quote</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.a>

                <motion.a
                  href="/catalogue"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold rounded-full hover:shadow-lg transition-all duration-200"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>View Products</span>
                </motion.a>

                {/* Call Button - Mobile Visible, Desktop Hidden */}
                {isMobile && (
                  <motion.a
                    href={`tel:${phoneNumber}`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-full hover:shadow-lg transition-all duration-200"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </motion.a>
                )}
              </motion.div>
            </motion.div>

            {/* Right Column - Carousel - Comes after content on mobile */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:order-2 mt-8 lg:mt-0"
            >
              <div className="relative h-[400px] sm:h-[500px] lg:h-[550px] rounded-2xl lg:rounded-3xl overflow-hidden shadow-xl border border-neutral-200 dark:border-neutral-800">
                <AnimatePresence mode="wait">
                  {slides.map(
                    (slide, index) =>
                      index === activeSlide && (
                        <motion.div
                          key={slide.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute inset-0"
                        >
                          {/* Background Image */}
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${slide.image})` }}
                          />

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                          {/* Content */}
                          <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                            <div className="space-y-4">
                              <div className="inline-block px-3 py-1.5 lg:px-4 lg:py-2 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
                                <span className="text-sm font-medium text-white">
                                  Featured Product
                                </span>
                              </div>

                              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
                                {slide.title}
                              </h3>

                              <p className="text-white/90 text-base lg:text-lg">
                                {slide.description}
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {slide.features.map((feature, i) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 lg:px-3 lg:py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-xs lg:text-sm text-white border border-white/30"
                                  >
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                  )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <button
                  onClick={prevSlide}
                  className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </button>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveSlide(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === activeSlide
                          ? "w-6 sm:w-8 bg-white"
                          : "bg-white/50 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Call Now Card - Desktop Only */}
              {!isMobile && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-lg"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-neutral-100 dark:bg-neutral-800 rounded-full">
                        <Phone className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-neutral-800 dark:text-white">
                          Need Immediate Help?
                        </h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">
                          Call for instant consultation
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${phoneNumber}`}
                      className="px-5 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium rounded-full hover:shadow-lg transition-all duration-200 whitespace-nowrap text-center"
                    >
                      Call Now
                    </a>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
