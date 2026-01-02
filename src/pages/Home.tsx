import React, { useState, useEffect } from "react";
import { ref, onValue } from "../config/firebase";
import { database } from "../config/firebase";
import { Testimonial, Product, OurWorkItem } from "../types";
import Hero from "../components/Hero";
import ProductCard from "../components/product/ProductCard";
import ProductModal from "../components/product/ProductModal";
import OurWorkPublic from "./OurWork";
import Reviews from "../components/Reviews";
import {
  ArrowRight,
  Shield,
  Zap,
  Ruler,
  EyeOff,
  Clock,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORY_IMAGES = {
  sheer:
    "https://media.istockphoto.com/id/1442115350/photo/modern-design-of-gray-fabric-sofa-with-cushion-and-round-black-coffee-table-in-luxury-white.jpg?s=612x612&w=0&k=20&c=zlTdhIZWcT-yjRSbQU2ZP5H40n76o47TcMRUsEYFc_s=",
  blinds:
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT4vYrHlcgnWE_dTb1ugv9CyaWoDTtAzJnPxA&s",
  mosquito:
    "https://media.istockphoto.com/id/1492463709/photo/hand-hold-pleated-mosquito-net-wire-screen-handle-on-house-window.jpg?s=612x612&w=0&k=20&c=RitElFFOlM8T7mLdViTCT-H0Z2Y7B71tbGLkZDYy8jY=",
  motorized:
    "https://media.istockphoto.com/id/1438964450/photo/roller-blinds-on-the-windows-in-the-interior.jpg?s=612x612&w=0&k=20&c=Gs9RNXBV1Svrem8VEgoOtw2ZZQUj0eo1kjC5otE3wY8=",
  pvc: "https://images.unsplash.com/photo-1560448204-603b3fc33ddc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
  zebra:
    "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
};

const SkeletonCard: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div
    className={`bg-gray-100 dark:bg-slate-800 rounded-xl overflow-hidden animate-pulse ${className}`}
  >
    <div className="bg-gray-200 dark:bg-slate-700 h-40 w-full" />
    <div className="p-4">
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/3"></div>
    </div>
  </div>
);

const Home: React.FC = () => {
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [_ourWorkItems, setOurWorkItems] = useState<any[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  // Loading flags
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingWork, setLoadingWork] = useState(true);
  const [_loadingTestimonials, setLoadingTestimonials] = useState(true);

  useEffect(() => {
    // Testimonials
    const testimonialsRef = ref(database, "testimonials");
    const unsubTestimonials = onValue(testimonialsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Testimonial[] = Object.keys(data)
          .map((k) => ({ id: k, ...data[k] }))
          .filter((t) => t.isApproved)
          .sort(() => Math.random() - 0.5)
          .slice(0, 3);
        setTestimonials(list);
      } else {
        setTestimonials([]);
      }
      setLoadingTestimonials(false);
    });

    // Products
    const productsRef = ref(database, "products");
    const unsubProducts = onValue(productsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Product[] = Object.keys(data).map((k) => ({
          id: k,
          ...data[k],
        }));
        setProducts(list);
      } else {
        setProducts([]);
      }
      setLoadingProducts(false);
    });

    // OurWork
    const ourWorkRef = ref(database, "ourWork");
    const unsubWork = onValue(ourWorkRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: OurWorkItem[] = Object.keys(data)
          .map((k) => ({ id: k, ...data[k] }))
          .slice(0, 5);
        setOurWorkItems(list);
      } else {
        setOurWorkItems([]);
      }
      setLoadingWork(false);
    });

    return () => {
      unsubTestimonials();
      unsubProducts();
      unsubWork();
    };
  }, []);

  const previewProducts = products.slice(0, 4);

  // Product categories data with images
  const productCategories = [
    {
      title: "Curtain Sheer Fabrics",
      description:
        "Elegant and lightweight fabrics that filter light while maintaining privacy",
      icon: <EyeOff className="w-6 h-6" />,
      image: CATEGORY_IMAGES.sheer,
      features: ["Light Filtering", "Elegant Draping", "Various Colors"],
    },
    {
      title: "Ready-made Blinds",
      description:
        "Precision-cut blinds available in various sizes for quick installation",
      icon: <Ruler className="w-6 h-6" />,
      image: CATEGORY_IMAGES.blinds,
      features: ["Perfect Fit", "Quick Installation", "Multiple Sizes"],
    },
    {
      title: "Pleated Mosquito Mesh",
      description:
        "Discreet protection against insects without compromising on ventilation",
      icon: <Shield className="w-6 h-6" />,
      image: CATEGORY_IMAGES.mosquito,
      features: ["Insect Protection", "Full Ventilation", "Discreet Design"],
    },
    {
      title: "Motorised Solutions",
      description:
        "Automated curtains and blinds for modern, convenient living",
      icon: <Zap className="w-6 h-6" />,
      image: CATEGORY_IMAGES.motorized,
      features: ["Smart Control", "Energy Efficient", "Quiet Operation"],
    },
  ];

  // Benefits data
  const benefits = [
    {
      title: "Custom Sizing",
      description: "Perfect fit for any window dimension",
      icon: <Ruler className="w-5 h-5" />,
    },
    {
      title: "Quick Installation",
      description: "Professional fitting in less time",
      icon: <Clock className="w-5 h-5" />,
    },
    {
      title: "Premium Materials",
      description: "Quality fabrics built to last",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      title: "5-Year Warranty",
      description: "Comprehensive warranty coverage",
      icon: <CheckCircle className="w-5 h-5" />,
    },
  ];

  return (
    <div
      className="bg-neutral-50 dark:bg-neutral-950
text-neutral-900 dark:text-neutral-100
overflow-hidden
transition-colors duration-300
"
    >
      {/* HERO */}
      <Hero />

      {/* Product categories section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Decor Drapes Instyle
          </h2>
          <p className="text-gray-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Transform your space with our curated collection of high-quality
            window treatments
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
  {productCategories.map((category, index) => (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-neutral-50 dark:bg-neutral-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-neutral-200 dark:border-neutral-700 flex flex-col h-full"
    >
      {/* Card Flex Container */}
      <div className="flex flex-col sm:flex-row w-full h-full flex-1">
        {/* Image Section */}
        <div className="sm:w-2/5 relative h-32 sm:h-48 flex-shrink-0">
          <img
            src={category.image}
            alt={category.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Icon Overlay */}
          <div className="absolute top-2 left-2 bg-neutral-900 dark:bg-neutral-50 p-2 rounded-lg text-neutral-50 dark:text-neutral-900 flex items-center justify-center text-sm">
            {category.icon}
          </div>
        </div>

        {/* Content Section */}
        <div className="sm:w-3/5 p-4 sm:p-6 flex flex-col justify-between flex-1">
          <div>
            <h3 className="font-semibold text-sm sm:text-xl mb-2 text-neutral-900 dark:text-neutral-100">
              {category.title}
            </h3>
            <p className="text-neutral-700 dark:text-neutral-400 mb-4 text-xs sm:text-sm">
              {category.description}
            </p>
          </div>

          {/* Feature Pills — wrap naturally */}
          <div className="flex flex-wrap gap-2 mt-auto">
            {category.features.map((feature, i) => (
              <span
                key={i}
                className="text-xs sm:text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-full inline-flex items-center"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  ))}
</div>

      </section>

      {/* Benefits section */}
<section className="bg-neutral-50 dark:bg-neutral-900 py-14 sm:py-16 lg:py-20">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <motion.div
      className="text-center mb-10 sm:mb-14"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
    >
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mb-3">
        Why Choose Us
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 text-base sm:text-lg max-w-xl mx-auto">
        Premium products, thoughtful design, and service you can trust.
      </p>
    </motion.div>

    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {benefits.map((benefit, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.45, delay: index * 0.08 }}
          className="
            group
            rounded-2xl
            bg-white/70 dark:bg-neutral-800/60
            backdrop-blur
            border border-neutral-200/70 dark:border-neutral-700/60
            p-5 sm:p-6
            transition-all duration-300
            hover:-translate-y-1
            hover:shadow-xl hover:shadow-neutral-900/5
          "
        >
          {/* Icon */}
          <div
            className="
              mb-4
              mx-auto
              flex h-11 w-11 items-center justify-center
              rounded-xl
              bg-neutral-100 dark:bg-neutral-700
              text-neutral-800 dark:text-neutral-100
              group-hover:bg-neutral-900
              group-hover:text-white
              dark:group-hover:bg-neutral-100
              dark:group-hover:text-neutral-900
              transition-colors
            "
          >
            {benefit.icon}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 text-center">
            {benefit.title}
          </h3>

          {/* Description */}
          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center leading-relaxed">
            {benefit.description}
          </p>
        </motion.div>
      ))}
    </div>
  </div>
</section>


      {/* Featured products section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white text-center sm:text-left"
          >
            Featured Products
          </motion.h2>
          <motion.a
            href="/catalogue"
            className="inline-flex items-center text-neutral-700 dark:text-neutral-300 font-medium gap-2 group text-base
                      hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            View Full Catalogue
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </motion.a>

        </div>

        {/* Products grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 gap-6 justify-items-center">
          {loadingProducts
            ? Array(6)
                .fill(0)
                .map((_, idx) => <SkeletonCard key={idx} className="h-72" />)
            : previewProducts.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <ProductCard
                    product={p}
                    onViewDetails={() => setSelectedProduct(p)}
                  />
                </motion.div>
              ))}
        </div>
      </section>

      {/* Our Work */}
      <section className="bg-neutral-50 dark:bg-neutral-950 py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            {loadingWork ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6">
                {Array(5)
                  .fill(0)
                  .map((_, idx) => (
                    <SkeletonCard key={idx} className="h-48" />
                  ))}
              </div>
            ) : (
              <OurWorkPublic previewCount={5} />
            )}
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4"
          >
            Client Testimonials
          </motion.h2>
          <motion.p
            className="text-gray-600 md:text-lg sm:text-xl dark:text-slate-400 text-sm max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Hear what our satisfied customers have to say about our products and
            service
          </motion.p>
        </div>

        {/* Combined Reviews Component */}
        <div className="w-full">
          <Reviews localReviews={testimonials} />
        </div>
      </section>

      {/* CTA Section */}
<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
  <motion.div
    className="
      rounded-2xl p-8 md:p-12 text-center
      bg-neutral-100 dark:bg-neutral-800
      text-neutral-900 dark:text-neutral-100
      shadow-sm
    "
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-50px' }}
    transition={{ duration: 0.6 }}
  >
    <div className="max-w-2xl mx-auto">
      <h3 className="text-2xl md:text-3xl font-bold mb-4">
        Ready to Transform Your Space?
      </h3>

      <p className="text-neutral-600 dark:text-neutral-400 mb-8 text-lg">
        Get a free consultation and quote for your window treatment needs
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        {/* Primary CTA */}
        <motion.a
          href="/contact"
          className="
            inline-flex items-center justify-center
            px-8 py-4 rounded-full
            bg-neutral-900 dark:bg-neutral-100
            text-neutral-100 dark:text-neutral-900
            font-semibold
            hover:bg-neutral-800 dark:hover:bg-neutral-200
            transition-colors
          "
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          Book Consultation
        </motion.a>

        {/* Secondary CTA */}
        <motion.a
          href="/estimate"
          className="
            inline-flex items-center justify-center
            px-8 py-4 rounded-full
            border border-neutral-400 dark:border-neutral-600
            text-neutral-900 dark:text-neutral-100
            font-medium
            hover:bg-neutral-200 dark:hover:bg-neutral-700
            transition-colors
          "
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          Get Free Quote
        </motion.a>
      </div>
    </div>
  </motion.div>
</section>


      {/* Product modal */}
      <AnimatePresence>
        {selectedProduct && (
          <ProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;
