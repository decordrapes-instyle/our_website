import React, { useState, useEffect } from 'react';
import { ref, onValue } from '../config/firebase';
import { database } from '../config/firebase';
import { SiteSettings, TeamMember } from '../types';
import {
  Users,
  Target,
  Award,
  Heart,
  MapPin,
  Phone,
  Mail,
  ArrowUpRight,
} from 'lucide-react';

function BrandMark() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      <span className="w-7 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400" />
      <span className="w-3 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
    </div>
  );
}

function SectionHeading({
  title,
  subtitle,
  align = 'center',
}: {
  title: React.ReactNode;
  subtitle?: string;
  align?: 'center' | 'left';
}) {
  const isCenter = align === 'center';

  return (
    <div className={isCenter ? 'text-center mb-12' : 'mb-7'}>
      <div className={`mb-4 ${isCenter ? 'flex justify-center' : ''}`}>
        <BrandMark />
      </div>

      <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-neutral-950 dark:text-white">
        {title}
      </h2>

      {subtitle && (
        <p
          className={`text-sm sm:text-base text-neutral-500 dark:text-neutral-400 mt-3 leading-relaxed ${
            isCenter ? 'max-w-xl mx-auto' : ''
          }`}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

type Tone = 'sky' | 'gold';

const TONE_CLASSES: Record<
  Tone,
  {
    bg: string;
    text: string;
    hover: string;
  }
> = {
  sky: {
    bg: 'bg-sky-50 dark:bg-sky-400/10',
    text: 'text-sky-600 dark:text-sky-400',
    hover: 'group-hover:bg-sky-100 dark:group-hover:bg-sky-400/15',
  },
  gold: {
    bg: 'bg-amber-50 dark:bg-amber-400/10',
    text: 'text-amber-600 dark:text-amber-400',
    hover: 'group-hover:bg-amber-100 dark:group-hover:bg-amber-400/15',
  },
};

function IconTile({
  icon: Icon,
  tone,
  size = 'normal',
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  size?: 'normal' | 'large';
}) {
  const c = TONE_CLASSES[tone];

  return (
    <div
      className={`
        ${size === 'large' ? 'w-14 h-14 rounded-2xl' : 'w-11 h-11 rounded-xl'}
        ${c.bg} ${c.hover}
        flex items-center justify-center shrink-0
        transition-all duration-300
      `}
    >
      <Icon
        className={`${size === 'large' ? 'w-6 h-6' : 'w-5 h-5'} ${c.text}`}
      />
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
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}

const About: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
    const settingsRef = ref(database, 'siteSettings');

    const unsubscribeSettings = onValue(settingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const settingsData = snapshot.val();

        const settingsList: SiteSettings[] = Object.keys(settingsData).map(
          (key) => ({
            id: key,
            ...settingsData[key],
          })
        );

        setSettings(settingsList);
      }
    });

    const teamRef = ref(database, 'teamMembers');

    const unsubscribeTeam = onValue(teamRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamData = snapshot.val();

        const teamList: TeamMember[] = Object.keys(teamData)
          .map((key) => ({
            id: key,
            ...teamData[key],
          }))
          .filter((member) => member.isActive)
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
    const setting = settings.find((s) => s.key === key);
    return setting?.value || '';
  };

  const storeName = getSetting('store_name');
  const storeDescription = getSetting('site_description');

  const values = [
    {
      icon: Target,
      title: 'Excellence',
      description:
        'We strive for excellence in every product we offer and every service we provide.',
      tone: 'sky' as Tone,
    },
    {
      icon: Heart,
      title: 'Integrity',
      description:
        'Honesty and transparency are at the core of all our business relationships.',
      tone: 'gold' as Tone,
    },
    {
      icon: Users,
      title: 'Community',
      description:
        'We believe in building strong relationships and giving back to our community.',
      tone: 'sky' as Tone,
    },
  ];

  const highlights = [
    { icon: Award, text: 'Quality guarantee', tone: 'gold' as Tone },
    { icon: Heart, text: 'Customer-first approach', tone: 'sky' as Tone },
    { icon: Target, text: 'Competitive pricing', tone: 'gold' as Tone },
    { icon: Users, text: 'Expert support team', tone: 'sky' as Tone },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-sky-400/5 dark:bg-sky-400/5 blur-3xl" />
        <div className="pointer-events-none absolute top-20 right-0 w-[300px] h-[300px] rounded-full bg-amber-400/5 dark:bg-amber-400/5 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
          <header className="text-center max-w-3xl mx-auto mb-20 md:mb-28">
            <div className="flex justify-center mb-6">
              <BrandMark />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-neutral-950 dark:text-white">
              About{' '}
              <span className="font-normal bg-gradient-to-r from-sky-500 to-sky-600 dark:from-sky-400 dark:to-sky-300 bg-clip-text text-transparent">
                {storeName}
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-8">
              {storeDescription}
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em] text-neutral-400 dark:text-neutral-500">
              <span>Quality</span>
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              <span>Trust</span>
              <span className="w-1 h-1 rounded-full bg-sky-500" />
              <span>Service</span>
            </div>
          </header>

          <section className="grid lg:grid-cols-[1.15fr_0.85fr] gap-8 lg:gap-12 mb-24 md:mb-32">
            <div className="lg:pr-8">
              <SectionHeading title="Our Story" align="left" />

              <div className="space-y-5 text-neutral-600 dark:text-neutral-400 leading-7">
                <p>
                  Founded with a vision to make quality products accessible to
                  everyone, our shop has been serving customers with dedication
                  and excellence for years.
                </p>

                <p>
                  We believe in building lasting relationships with our
                  customers by providing not just products, but complete
                  solutions that meet their needs.
                </p>

                <p>
                  Our commitment to quality, innovation, and customer
                  satisfaction drives everything we do.
                </p>
              </div>
            </div>

            <Surface className="p-7 sm:p-8">
              <div className="flex items-start justify-between mb-7">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400 mb-2">
                    Our promise
                  </p>
                  <h3 className="text-xl font-medium text-neutral-950 dark:text-white">
                    Why choose us
                  </h3>
                </div>

                <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                </div>
              </div>

              <ul className="space-y-3">
                {highlights.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors group"
                  >
                    <IconTile icon={item.icon} tone={item.tone} />
                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                      {item.text}
                    </span>
                  </li>
                ))}
              </ul>
            </Surface>
          </section>

          <section className="mb-24 md:mb-32">
            <SectionHeading
              title="Our Values"
              subtitle="The principles that guide how we work, serve, and grow."
            />

            <div className="grid md:grid-cols-3 gap-5">
              {values.map((value, index) => (
                <Surface
                  key={index}
                  className="group p-7 sm:p-8 hover:-translate-y-1 hover:shadow-md"
                >
                  <IconTile
                    icon={value.icon}
                    tone={value.tone}
                    size="large"
                  />

                  <div className="mt-7">
                    <h3 className="text-lg font-medium text-neutral-950 dark:text-white">
                      {value.title}
                    </h3>

                    <div
                      className={`mt-3 w-8 h-px ${
                        value.tone === 'gold'
                          ? 'bg-amber-400'
                          : 'bg-sky-400'
                      }`}
                    />

                    <p className="mt-4 text-sm text-neutral-600 dark:text-neutral-400 leading-6">
                      {value.description}
                    </p>
                  </div>
                </Surface>
              ))}
            </div>
          </section>

          <section className="mb-24 md:mb-32">
            <SectionHeading
              title="Meet Our Team"
              subtitle="The people behind the excellence."
            />

            {teamMembers.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {teamMembers.map((member) => (
                  <Surface
                    key={member.id}
                    className="group p-7 text-center hover:-translate-y-1 hover:shadow-md"
                  >
                    <div className="relative w-24 h-24 mx-auto">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-sky-400 to-amber-400 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-500" />

                      <div className="relative w-24 h-24 overflow-hidden rounded-full ring-4 ring-white dark:ring-neutral-900">
                        <img
                          src={
                            member.image ||
                            'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg'
                          }
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-neutral-950 dark:text-white">
                        {member.name}
                      </h3>

                      <p className="mt-1 text-sm font-medium text-sky-600 dark:text-sky-400">
                        {member.position}
                      </p>

                      <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400 leading-6 max-w-xs mx-auto">
                        {member.bio}
                      </p>
                    </div>
                  </Surface>
                ))}
              </div>
            ) : (
              <Surface className="text-center p-10 border-dashed">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-400/10 flex items-center justify-center">
                  <Users className="w-7 h-7 text-sky-500 dark:text-sky-400" />
                </div>

                <p className="mt-5 text-sm text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-6">
                  Our dedicated team of professionals is here to help you find
                  exactly what you need. With years of experience and a passion
                  for customer service, we're committed to your satisfaction.
                </p>
              </Surface>
            )}
          </section>

          <section>
            <SectionHeading
              title="Visit Us"
              subtitle="We'd love to connect with you."
            />

            <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6">
              <Surface className="overflow-hidden p-2">
                <div className="w-full h-[300px] sm:h-[360px] rounded-2xl overflow-hidden">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1944.0738054050848!2d77.58994253612006!3d12.962404815078278!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae15fde41358f3%3A0x51705d17187d7f8a!2sDecor%20Drapes%20Instyle%20%2F%20Monsoon%20Blinds%20%2F%20Zebra%20Blinds%20%2F%20Roller%20Blinds!5e0!3m2!1sen!2sin!4v1756963029833!5m2!1sen!2sin"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="grayscale hover:grayscale-0 transition-all duration-500"
                  />
                </div>
              </Surface>

              <Surface className="p-7 sm:p-8">
                <p className="text-xs uppercase tracking-[0.18em] text-sky-600 dark:text-sky-400 mb-2">
                  Come visit
                </p>

                <h3 className="text-xl font-medium text-neutral-950 dark:text-white mb-7">
                  {storeName}
                </h3>

                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <IconTile icon={MapPin} tone="sky" />
                    <div className="pt-1">
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                        Address
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-6">
                        {getSetting('store_address') ||
                          '123 MG Road, Bengaluru, India'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <IconTile icon={Phone} tone="gold" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                        Phone
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">
                        {getSetting('primary_phone') || '+91 98765 43210'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <IconTile icon={Mail} tone="sky" />
                    <div>
                      <p className="text-xs uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                        Email
                      </p>
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 break-all">
                        {getSetting('primary_email') || 'info@decordrapes.com'}
                      </p>
                    </div>
                  </div>
                </div>
              </Surface>
            </div>
          </section>

          <div className="mt-20 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex justify-center">
            <BrandMark />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
