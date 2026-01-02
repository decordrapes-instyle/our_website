import React, { useState, useEffect } from 'react';
import { ref, onValue } from '../config/firebase';
import { database } from '../config/firebase';
import { SiteSettings, TeamMember } from '../types';
import { Users, Target, Award, Heart, MapPin, Phone, Mail } from 'lucide-react';

const About: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const settingsRef = ref(database, 'siteSettings');
    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.val();
        const settingsList: SiteSettings[] = Object.keys(settingsData).map(key => ({
          id: key,
          ...settingsData[key],
        }));
        setSettings(settingsList);
      }
    });

    const teamRef = ref(database, 'teamMembers');
    const unsubscribeTeam = onValue(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamData = snapshot.val();
        const teamList: TeamMember[] = Object.keys(teamData)
          .map(key => ({
            id: key,
            ...teamData[key],
          }))
          .filter(member => member.isActive)
          .sort((a, b) => a.order - b.order);
        setTeamMembers(teamList);
      }
    });

    return () => {
      unsubscribeSettings();
      unsubscribeTeam();
    };
  }, []);

  const getSetting = (key: string) => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || '';
  };

  const storeName = getSetting('store_name');
  const storeDescription = getSetting('site_description');

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-neutral-950 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24">
          <h1 className="text-3xl md:text-4xl font-light text-gray-900 dark:text-gray-100 mb-4">
            About <span className="font-medium text-blue-600 dark:text-blue-400">{storeName}</span>
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            {storeDescription}
          </p>
        </div>

        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-16 mb-20 md:mb-28">
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 bg-gradient-to-b from-blue-400 to-indigo-500 rounded-full"></div>
              <h2 className="text-2xl font-normal text-gray-900 dark:text-gray-100">Our Story</h2>
            </div>
            <div className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Founded with a vision to make quality products accessible to everyone, our shop has been serving customers 
                with dedication and excellence for years.
              </p>
              <p>
                We believe in building lasting relationships with our customers by providing not just products, 
                but complete solutions that meet their needs.
              </p>
              <p>
                Our commitment to quality, innovation, and customer satisfaction drives everything we do.
              </p>
            </div>
          </div>
          
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 p-8 space-y-6 border border-blue-100 dark:border-gray-700">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-indigo-200/30 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-full -translate-y-16 translate-x-16"></div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 relative z-10">Why Choose Us</h3>
            <ul className="space-y-4 relative z-10">
              {[
                { icon: Award, text: 'Quality Guarantee', color: 'text-yellow-500' },
                { icon: Heart, text: 'Customer First Approach', color: 'text-rose-500' },
                { icon: Target, text: 'Competitive Pricing', color: 'text-emerald-500' },
                { icon: Users, text: 'Expert Support Team', color: 'text-blue-500' }
              ].map((item, index) => (
                <li key={index} className="flex items-center text-gray-700 dark:text-gray-300 group">
                  <item.icon className={`w-5 h-5 mr-3 ${item.color} transition-transform group-hover:scale-110`} />
                  <span className="group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20 md:mb-28">
          <h2 className="text-2xl font-normal text-gray-900 dark:text-gray-100 text-center mb-12">
            Our <span className="font-medium">Values</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: Target, 
                title: 'Excellence', 
                description: 'We strive for excellence in every product we offer and every service we provide.',
                gradient: 'from-blue-400 to-cyan-400'
              },
              { 
                icon: Heart, 
                title: 'Integrity', 
                description: 'Honesty and transparency are at the core of all our business relationships.',
                gradient: 'from-rose-400 to-pink-500'
              },
              { 
                icon: Users, 
                title: 'Community', 
                description: 'We believe in building strong relationships and giving back to our community.',
                gradient: 'from-emerald-400 to-green-500'
              }
            ].map((value, index) => (
              <div key={index} className="text-center space-y-4 group">
                <div className={`w-14 h-14 bg-gradient-to-br ${value.gradient} rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">{value.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20 md:mb-28">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-normal text-gray-900 dark:text-gray-100">
              Meet Our <span className="font-medium">Team</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">The people behind the excellence</p>
          </div>
          
          {teamMembers.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="group text-center space-y-4">
                  <div className="relative w-28 h-28 mx-auto">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300"></div>
                    <div className="relative w-24 h-24 mx-auto overflow-hidden rounded-full border-2 border-white dark:border-gray-800 shadow-lg group-hover:scale-105 transition-transform duration-300">
                      <img
                        src={member.image || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">{member.name}</h3>
                    <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-3">{member.position}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                      {member.bio}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Our dedicated team of professionals is here to help you find exactly what you need. 
                With years of experience and a passion for customer service, we're committed to your satisfaction.
              </p>
            </div>
          )}
        </div>

        {/* Contact Section */}
        <div className="space-y-12">
          <div className="text-center">
            <h2 className="text-2xl font-normal text-gray-900 dark:text-gray-100 mb-3">Visit Us</h2>
            <p className="text-gray-500 dark:text-gray-400">We'd love to connect with you</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Map */}
            <div className="space-y-6">
              <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1944.0738054050848!2d77.58994253612006!3d12.962404815078278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15fde41358f3%3A0x51705d17187d7f8a!2sDecor%20Drapes%20Instyle%20%2F%20Monsoon%20Blinds%20%2F%20Zebra%20Blinds%20%2F%20Roller%20Blinds!5e0!3m2!1sen!2sin!4v1756963029833!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all duration-500"
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-8">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  {storeName}
                </h3>
                <div className="space-y-6">
                  <div className="flex items-start group">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-4 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                      <MapPin className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 pt-2">
                      {getSetting('store_address') || '123 MG Road, Bengaluru, India'}
                    </span>
                  </div>
                  <div className="flex items-center group">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mr-4 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 transition-colors">
                      <Phone className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {getSetting('primary_phone') || '+91 98765 43210'}
                    </span>
                  </div>
                  <div className="flex items-center group">
                    <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mr-4 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 transition-colors">
                      <Mail className="w-5 h-5 text-rose-500" />
                    </div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {getSetting('primary_email') || 'info@decordrapes.com'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand Accent */}
        <div className="mt-20 pt-8 border-t border-gray-200 dark:border-gray-800 text-center">
          <div className="flex items-center justify-center gap-4 text-gray-400 dark:text-gray-500">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500"></div>
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-emerald-400 to-green-500"></div>
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500"></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;