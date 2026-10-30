import { useRef, useState, useEffect, useMemo } from "react"
import { Heart, ChevronUp } from "lucide-react"
import ContactSheet from "./ContactSheet"
import { database } from "../../config/firebase"
import { ref, get, set, runTransaction } from "../../config/firebase"
import { SiteSettings } from "../../types"

const LIKE_PATH = "like/fromFooter"
const LOCAL_QUEUE_KEY = "footer-like-queue"
const MAX_CLICK_SAFE = 10

/**
 * Extra credits shown after "Pankaj", read from the siteSettings sheet.
 * Add one row per value (use 1, 2, 3 ... in the key):
 *
 *   made_with_1_name      Acme Studio
 *   made_with_1_url       https://acme.studio
 *   made_with_1_favicon   https://acme.studio/favicon.png   (optional)
 *
 * If the favicon row is empty, the favicon is fetched from the link.
 */
interface Credit {
  index: number
  name: string
  url: string
  favicon: string
}

const KEY_PATTERN = /^made_with_(\d+)_(name|url|favicon)$/

const normalizeUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed || trimmed === "#") return ""
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}

const getHost = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

const parseCredits = (settings: SiteSettings[]): Credit[] => {
  const byIndex = new Map<number, Credit>()

  settings.forEach((setting) => {
    const match = KEY_PATTERN.exec(setting.key)
    if (!match) return

    const index = Number(match[1])
    const field = match[2] as "name" | "url" | "favicon"
    const credit = byIndex.get(index) ?? { index, name: "", url: "", favicon: "" }
    const value = String(setting.value ?? "").trim()

    credit[field] = field === "url" ? normalizeUrl(value) : value
    byIndex.set(index, credit)
  })

  return Array.from(byIndex.values())
    .filter((credit) => credit.name || credit.url)
    .sort((a, b) => a.index - b.index)
}

function CreditItem({ credit }: { credit: Credit }) {
  const [iconFailed, setIconFailed] = useState(false)

  const host = getHost(credit.url)
  const label = credit.name || host
  const iconSrc =
    credit.favicon ||
    (host ? `https://www.google.com/s2/favicons?domain=${host}&sz=64` : "")

  const content = (
    <>
      {iconSrc && !iconFailed ? (
        <img
          src={iconSrc}
          alt=""
          width={16}
          height={16}
          loading="lazy"
          onError={() => setIconFailed(true)}
          className="w-4 h-4 rounded-sm object-contain"
        />
      ) : (
        <span
          aria-hidden="true"
          className="w-4 h-4 rounded-sm flex items-center justify-center text-[10px] font-bold bg-neutral-300 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200"
        >
          {label.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="font-medium text-neutral-800 dark:text-neutral-200">{label}</span>
    </>
  )

  const baseClass = "inline-flex items-center gap-1.5"

  if (!credit.url) {
    return <span className={baseClass}>{content}</span>
  }

  return (
    <a
      href={credit.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${baseClass} hover:underline underline-offset-2`}
    >
      {content}
    </a>
  )
}

export default function FooterMadeWith({ settings = [] }: { settings?: SiteSettings[] }) {
  const [hasLiked, setHasLiked] = useState(false)
  const [showContactHint, setShowContactHint] = useState(false)
  const [open, setOpen] = useState(false)
  const bufferRef = useRef(0)
  const flushTimeout = useRef<NodeJS.Timeout | null>(null)
  const hideHintTimeout = useRef<NodeJS.Timeout | null>(null)
  const clickCountRef = useRef(0)
  const [highlightContact, setHighlightContact] = useState(false)
  const credits = useMemo(() => parseCredits(settings), [settings])

  useEffect(() => {
    if (localStorage.getItem("hasLiked") === "true") {
      setHasLiked(true);
    }
  }, []);

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
    setShowContactHint(true)
    if (hideHintTimeout.current) clearTimeout(hideHintTimeout.current)
    hideHintTimeout.current = setTimeout(() => setShowContactHint(false), 2000)

    if (hasLiked) {
      return;
    }

    setHasLiked(true);
    localStorage.setItem("hasLiked", "true");

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
      <div className="py-3 px-4 flex flex-wrap justify-center items-center gap-x-1 gap-y-2 text-xs text-neutral-600 dark:text-neutral-400">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 focus:outline-none"
        >
          Made with
          <Heart
            className={`w-4 h-4 transition-transform duration-100 ease-out ${
              hasLiked
                ? "fill-red-500 text-red-500"
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

        {credits.map((credit) => (
          <span key={credit.index} className="inline-flex items-center gap-1.5">
            <span>&</span>
            <CreditItem credit={credit} />
          </span>
        ))}

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