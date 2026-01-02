import { useEffect, useState } from "react"
import { X, Mail, Github, Linkedin, Instagram, Heart } from "lucide-react"
import { database } from "../../config/firebase"
import { ref, get } from "../../config/firebase"

interface ContactSheetProps {
  open: boolean
  onClose: () => void
  variant?: "default" | "like-limit"
}

const LIKE_PATH = "like/fromFooter"

export default function ContactSheet({
  open,
  onClose,
  variant = "default",
}: ContactSheetProps) {
  const [totalLikes, setTotalLikes] = useState<number>(0)

  // Fetch total likes
  useEffect(() => {
    if (!open) return
    const likeRef = ref(database, LIKE_PATH)
    get(likeRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          setTotalLikes(snapshot.val().count || 0)
        } else {
          setTotalLikes(0)
        }
      })
      .catch(console.error)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Card / Sheet */}
      <div
        className="
          relative
          bg-white dark:bg-neutral-900
          rounded-t-2xl sm:rounded-2xl
          w-full sm:max-w-md
          p-6 sm:p-8
          shadow-lg sm:shadow-xl
          flex flex-col items-center gap-4
        "
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Profile Image */}
        <img
          src="https://avatars.githubusercontent.com/u/125809323?v=4"
          alt="Pankaj"
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-neutral-300 dark:border-neutral-700"
        />

        {/* Name & Variant */}
        <h3 className="text-lg sm:text-xl font-semibold text-neutral-800 dark:text-neutral-200 text-center">
          {variant === "like-limit" ? "Thanks for the love ❤️" : "Pankaj"}
        </h3>

        {/* Like-limit message */}
        {variant === "like-limit" && (
          <p className="text-center text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            Looks like you’re enjoying this a lot. If you’d like to connect or share
            feedback, I’d genuinely love to hear from you.
          </p>
        )}

        {/* Total likes display */}
        <div className="flex items-center gap-2 mt-1 text-sm sm:text-base text-neutral-700 dark:text-neutral-300">
          <Heart className="w-5 h-5 fill-red-500 text-red-500" /> {totalLikes} people liked this site
        </div>

        {/* Contact Links */}
        <div className="flex flex-col w-full gap-3 mt-4">
          <a
            href="mailto:pkumar8782744.pku@gmail.com"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition font-medium text-sm sm:text-base"
          >
            <Mail className="w-5 h-5 text-red-500" /> Gmail
          </a>
          <a
            href="https://github.com/pankaj8782"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition font-medium text-sm sm:text-base"
          >
            <Github className="w-5 h-5 text-neutral-700 dark:text-neutral-300" /> Github
          </a>
          <a
            href="https://linkedin.com/in/pankaj8782"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition font-medium text-sm sm:text-base"
          >
            <Linkedin className="w-5 h-5 text-blue-600" /> Linkedin
          </a>
          <a
            href="https://instagram.com/pankajshah.1"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition font-medium text-sm sm:text-base"
          >
            <Instagram className="w-5 h-5 text-pink-500" /> Instagram
          </a>
        </div>
      </div>
    </div>
  )
}
