import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Menu, X, Home, Star, Info, Phone, LogOut } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../../context/AuthContext';

type NavItem = {
    label: string;
    to?: string;
    icon?: JSX.Element;
};

const ProfileHeader: React.FC = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    const navLinks: NavItem[] = [
        { label: "Home", to: "/", icon: <Home size={16} /> },
        { label: "Our Work", to: "/our-work", icon: <Star size={16} /> },
        { label: "About", to: "/about", icon: <Info size={16} /> },
        { label: "Contact", to: "/contact", icon: <Phone size={16} /> },
    ];

    const handleLogout = async () => {
        try {
            await logout();
        } finally {
            setMenuOpen(false);
            navigate("/");
        }
    };

    const displayName = currentUser?.displayName?.split(' ')[0] || 'User';

    return (
        <div className="sm:hidden">
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-b-2xl shadow-lg mb-6 flex items-center justify-between sticky top-0 z-30">
                {/* Back button - always visible */}
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
                    <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-neutral-100" />
                </button>

                {/* Mobile Title */}
                <h1 className="text-xl font-bold text-gray-800 dark:text-neutral-100">
                    Profile
                </h1>

                {/* Hamburger menu for mobile, popover */}
                <div className="relative">
                    <button ref={buttonRef} onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700">
                        <Menu className="w-6 h-6 text-gray-800 dark:text-neutral-100" />
                    </button>

                    {menuOpen && (
                        <div
                            ref={menuRef}
                            className="absolute right-0 mt-2 w-64 bg-white dark:bg-neutral-800 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-700 z-50 animate-fadeIn"
                        >
                            <div className="p-2">
                                <div className="flex items-center justify-between p-2 border-b border-neutral-200 dark:border-neutral-700">
                                    <span className="font-bold text-neutral-900 dark:text-white text-sm">Hello, {displayName}</span>
                                    <button
                                        onClick={() => setMenuOpen(false)}
                                        className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    >
                                        <X size={18} className="text-neutral-600 dark:text-neutral-400" />
                                    </button>
                                </div>
                                <div className="mt-2 space-y-1">
                                    {navLinks.map((item) => (
                                        <Link
                                            key={item.label}
                                            to={item.to || "#"}
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                                        >
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                                <div className="p-2 mt-2 border-t border-neutral-200 dark:border-neutral-700 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">Theme</span>
                                        <ThemeToggle />
                                    </div>
                                    {currentUser && (
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium rounded-lg text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                                        >
                                            <LogOut size={16} />
                                            <span>Sign Out</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn { animation: fadeIn 0.15s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default ProfileHeader;
