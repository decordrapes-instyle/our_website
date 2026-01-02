import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useContext(ThemeContext);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const options = [
    { value: "light", label: "Light", icon: <Sun className="w-4 h-4" /> },
    { value: "dark", label: "Dark", icon: <Moon className="w-4 h-4" /> },
    { value: "system", label: "System", icon: <Monitor className="w-4 h-4" /> },
  ];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeOption = options.find((opt) => opt.value === theme);

  return (
    <>
      {/* MOBILE (inline buttons) */}
      <div className="flex md:hidden items-center gap-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value as any)}
            className={`p-2 rounded-lg transition-all duration-200 ${
              theme === opt.value
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
            title={opt.label}
          >
            {opt.icon}
          </button>
        ))}
      </div>

      {/* DESKTOP (dropdown) */}
<div className="hidden md:block relative" ref={menuRef}>
  {/* Trigger Button */}
  <button
    ref={buttonRef}
    onClick={() => setOpen((prev) => !prev)}
    className="
      flex items-center gap-2
      px-4 py-2
      rounded-full
      border border-gray-300 dark:border-neutral-600
      bg-neutral-50 dark:bg-neutral-800
      text-neutral-900 dark:text-neutral-100
      font-medium
      shadow-sm hover:shadow-md
      transition-all duration-200
    "
    aria-haspopup="true"
    aria-expanded={open}
  >
    {activeOption?.icon}
    <span className="text-sm capitalize">{activeOption?.label || "Theme"}</span>
    <ChevronDown
      className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    />
  </button>

  {/* Dropdown Menu */}
  {open && (
    <div className="absolute right-0 mt-2 w-32 bg-neutral-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-700 rounded-xl shadow-lg z-50 animate-fadeIn">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => {
            setTheme(opt.value as any);
            setOpen(false);
          }}
          className={`
            flex items-center gap-3 w-full px-4 py-2.5 text-sm rounded-lg transition-all duration-200
            ${
              theme === opt.value
                ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-semibold"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200"
            }
          `}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  )}
</div>


      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default ThemeToggle;
