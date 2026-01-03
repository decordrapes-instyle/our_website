import { useEffect, useRef, useState } from "react"
import { X, Mail, Github, Linkedin, Instagram, Heart } from "lucide-react"
import { database } from "../../config/firebase"
import { ref, get } from "../../config/firebase"

interface ContactSheetProps {
  open: boolean
  onClose: () => void
  variant?: "default" | "like-limit"
}

const LIKE_PATH = "like/fromFooter"
const SWIPE_CLOSE_THRESHOLD = 80

export default function ContactSheet({
  open,
  onClose,
  variant = "default",
}: ContactSheetProps) {
  const [totalLikes, setTotalLikes] = useState(0)
  const [translateY, setTranslateY] = useState(0)

  const startY = useRef<number | null>(null)

  /* Fetch likes */
  useEffect(() => {
    if (!open) return
    const likeRef = ref(database, LIKE_PATH)
    get(likeRef).then((snap) => {
      setTotalLikes(snap.exists() ? snap.val().count || 0 : 0)
    })
  }, [open])

  /* Back button / ESC */
  useEffect(() => {
    if (!open) return

    const handler = () => onClose()
    window.addEventListener("popstate", handler)
    window.addEventListener("keydown", (e) => e.key === "Escape" && onClose())

    history.pushState(null, "", location.href)

    return () => {
      window.removeEventListener("popstate", handler)
    }
  }, [open, onClose])

  /* Touch gestures */
  const onTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY
  }

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null) return
    const delta = e.touches[0].clientY - startY.current
    if (delta > 0) setTranslateY(delta)
  }

  const onTouchEnd = () => {
    if (translateY > SWIPE_CLOSE_THRESHOLD) {
      onClose()
    }
    setTranslateY(0)
    startY.current = null
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Sheet */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: `translateY(${translateY}px)` }}
        className="
          relative
          w-full sm:max-w-md
          bg-white dark:bg-neutral-900
          rounded-t-2xl sm:rounded-2xl
          p-6 sm:p-8
          shadow-xl
          transition-transform duration-200
          animate-slideUp
        "
      >
        {/* Drag handle */}
        <div className="sm:hidden mx-auto mb-3 h-1.5 w-12 rounded-full bg-neutral-300 dark:bg-neutral-700" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile */}
        <img
          src="https://avatars.githubusercontent.com/u/125809323?v=4"
          alt="Pankaj"
          className="w-24 h-24 rounded-full mx-auto border-2 border-neutral-300 dark:border-neutral-700"
        />

        <h3 className="mt-3 text-lg font-semibold text-center text-neutral-800 dark:text-neutral-200">
          {variant === "like-limit" ? "Thanks for the love ❤️" : "Pankaj"}
        </h3>

        {variant === "like-limit" && (
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            If you’d like to connect or share feedback, I’d love to hear from you.
          </p>
        )}

        <div className="flex justify-center items-center gap-2 mt-3 text-sm text-neutral-700 dark:text-neutral-300">
          <Heart className="w-5 h-5 fill-red-500 text-red-500" />
          {totalLikes} people liked this site
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3 mt-5">
          <ContactLink href="mailto:pkumar8782744.pku@gmail.com" icon={<Mail />} label="Gmail" />
          <ContactLink href="https://github.com/pankaj8782" icon={<Github />} label="Github" />
          <ContactLink href="https://linkedin.com/in/pankaj8782" icon={<Linkedin />} label="LinkedIn" />
          <ContactLink href="https://instagram.com/pankajshah.1" icon={<Instagram />} label="Instagram" />
        </div>
      </div>
    </div>
  )
}

function ContactLink({ href, icon, label }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition font-medium"
    >
      {icon} {label}
    </a>
  )
}
