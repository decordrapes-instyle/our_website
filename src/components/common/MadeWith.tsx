import { useRef, useState, useEffect } from "react"
import { Heart, ChevronUp } from "lucide-react"
import ContactSheet from "./ContactSheet"
import { database } from "../../config/firebase"
import { ref, get, set, runTransaction } from "../../config/firebase"

const LIKE_PATH = "like/fromFooter"
const LOCAL_QUEUE_KEY = "footer-like-queue"
const MAX_CLICK_SAFE = 10

export default function FooterMadeWith() {
  const [liked, setLiked] = useState(false)
  const [showContactHint, setShowContactHint] = useState(false)
  const [open, setOpen] = useState(false)
  const bufferRef = useRef(0)
  const flushTimeout = useRef<NodeJS.Timeout | null>(null)
  const hideHintTimeout = useRef<NodeJS.Timeout | null>(null)
  const heartTimeout = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)
  const [highlightContact, setHighlightContact] = useState(false)

  useEffect(() => {
    const likeRef = ref(database, LIKE_PATH)
    get(likeRef)
      .then((snapshot) => {
        if (!snapshot.exists()) {
          set(likeRef, { count: 0 })
        }
      })
      .catch(console.error)
  }, [])

  const flushBuffer = () => {
    if (bufferRef.current === 0) return
    const toAdd = bufferRef.current
    bufferRef.current = 0
    localStorage.setItem(LOCAL_QUEUE_KEY, "0")

    const likeRef = ref(database, LIKE_PATH)
    runTransaction(likeRef, (currentData) => {
      if (currentData === null) return { count: toAdd }
      return { count: (currentData.count || 0) + toAdd }
    }).catch(console.error)
  }

  const handleLike = () => {
    setLiked(true)
    if (heartTimeout.current) clearTimeout(heartTimeout.current)
    heartTimeout.current = setTimeout(() => setLiked(false), 300)
    setShowContactHint(true)
    if (hideHintTimeout.current) clearTimeout(hideHintTimeout.current)
    hideHintTimeout.current = setTimeout(() => setShowContactHint(false), 2000)
    bufferRef.current += 1
    localStorage.setItem(LOCAL_QUEUE_KEY, String(bufferRef.current))
    if (flushTimeout.current) clearTimeout(flushTimeout.current)
    flushTimeout.current = setTimeout(flushBuffer, 100)
    clickCountRef.current += 1
    if (clickCountRef.current >= MAX_CLICK_SAFE) {
      setHighlightContact(true)
    }
  }

  return (
    <>
      <div className="bg-neutral-100 dark:bg-neutral-900 border-t border-neutral-300 dark:border-neutral-800 py-3 flex justify-center items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 focus:outline-none"
        >
          Made with
          <Heart
            className={`w-4 h-4 transition-transform duration-100 ease-out ${
              liked
                ? "fill-red-500 text-red-500 scale-125 animate-pulse"
                : "text-red-500 dark:text-red-400"
            }`}
          /> by
        </button>
        <span
          onClick={handleLike}
          className="font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer select-none"
        >
          Pankaj
        </span>

        {showContactHint && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpen(true)
            }}
            className={`ml-2 inline-flex items-center gap-1 text-[10px] transition
              ${highlightContact
                ? "text-yellow-500 animate-pulse"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              }`}
          >
            contact <ChevronUp className="w-3 h-3" />
          </button>
        )}
      </div>

      <ContactSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}
