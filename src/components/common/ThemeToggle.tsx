import React, { useContext, useState, useRef, useEffect } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { Sun, Moon, Monitor, ChevronDown } from "lucide-react";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useContext(ThemeContext);
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

  const activeOption =
    options.find((opt) => opt.value === theme) ||
    options.find((opt) => opt.value === resolvedTheme);

  return (
    <>
      {/* MOBILE (inline buttons) */}
      <div className="flex md:hidden items-center gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value as any)}
            className={`p-2 rounded-xl transition ${
              theme === opt.value
                ? "bg-gray-200 dark:bg-gray-700"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            title={opt.label}
          >
            {opt.icon}
          </button>
        ))}
      </div>

      {/* DESKTOP (dropdown) */}
      <div className="hidden md:block relative" ref={menuRef}>
        <button
          ref={buttonRef}
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          aria-haspopup="true"
          aria-expanded={open}
        >
          {activeOption?.icon}
          <span className="text-sm capitalize">
            {activeOption?.label || "Theme"}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#1a1816] border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 animate-fadeIn z-50">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setTheme(opt.value as any);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md transition-all ${
                  theme === opt.value
                    ? "bg-gray-100 dark:bg-gray-800 text-[#b38b59] dark:text-[#d2a46c]"
                    : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200"
                }`}
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
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.15s ease-out; }
      `}</style>
    </>
  );
};

export default ThemeToggle;
