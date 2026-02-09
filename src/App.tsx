import { useEffect, useState } from 'react'
import './style.css'
import camouflageBg from './assets/canvasbg.jpg'

// Modal notification component
interface NotificationProps {
  message: string
  type: 'success' | 'error' | 'info'
  isOpen: boolean
  onClose: () => void
}

function NotificationModal({ message, type, isOpen, onClose }: NotificationProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose()
      }, 4000) // Auto close after 4 seconds
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const bgColor = {
    success: 'from-green-600 to-green-700',
    error: 'from-red-600 to-red-700',
    info: 'from-amber-600 to-amber-700'
  }[type]

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  }[type]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className={`bg-linear-to-r ${bgColor} text-white p-6 rounded-2xl shadow-2xl max-w-md w-full border border-white/20 animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold">{icon}</div>
          <div className="flex-1">
            <p className="text-lg font-medium leading-relaxed">{message}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white text-xl font-bold ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

function App() {
  // Function to convert English numbers to Arabic
  const toArabicNumerals = (num: number | string) => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    return String(num).replace(/[0-9]/g, (d) => arabicNumerals[parseInt(d)])
  }

  const toEnglishNumerals = (str: string) => {
    const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    return str.replace(/[٠-٩]/g, (d) => String(arabicNumerals.indexOf(d)))
  }

  // Function to format date as dd-mm-yyyy
  const formatDMY = (isoDate: string) => {
    const date = new Date(isoDate)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${toArabicNumerals(day)}-${toArabicNumerals(month)}-${toArabicNumerals(year)}`
  }
  // cookie name to persist the chosen end date
  const COOKIE_NAME = 'service_end_date'

  // helpers for cookies
  function setCookie(name: string, value: string, days = 3650) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
  }
  function getCookie(name: string) {
    const v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)')
    return v ? decodeURIComponent(v.pop() || '') : null
  }

  // i need to make the default date is the third month of the next year
  function defaultDateISO() {
    const d = new Date()
    d.setFullYear(d.getFullYear() + 1)
    d.setMonth(2) // March (0-based index)
    d.setDate(1) // First day of the month
    // keep only date portion
    return d.toISOString().slice(0, 10)
  }

  const [targetDateISO, setTargetDateISO] = useState<string>(() => {
    // Check URL parameters first
    const urlParams = new URLSearchParams(window.location.search);
    const dateParam = urlParams.get('date');
    if (dateParam) {
      return dateParam;
    }
    return getCookie(COOKIE_NAME) || defaultDateISO();
  })
  const [now, setNow] = useState<Date>(new Date())
  
  // State for individual date parts
  const [day, setDay] = useState<string>('');
  const [month, setMonth] = useState<string>('');
  const [year, setYear] = useState<string>('');

  // Notification state
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'info'
    isOpen: boolean
  }>({
    message: '',
    type: 'info',
    isOpen: false
  })

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, isOpen: true })
  }

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }))
  }

  useEffect(() => {
    // persist initial target date if cookie not already set
    if (!getCookie(COOKIE_NAME)) setCookie(COOKIE_NAME, targetDateISO)
    
    // Update Open Graph meta tags
    const updateMetaTags = () => {
      const target = new Date(targetDateISO + 'T23:59:59')
      const diffTime = Math.max(0, target.getTime() - Date.now())
      const daysRemaining = Math.floor(diffTime / (24 * 60 * 60 * 1000))
      
      const title = `عدّاد نهاية الخدمة العسكرية - باقي ${toArabicNumerals(daysRemaining)} يوم`
      const description = `التاريخ المستهدف: ${formatDMY(targetDateISO)} - هانت يا دفعة!`
      
      // Update document title
      document.title = title
      
      // Update or create meta tags
      const updateMeta = (property: string, content: string) => {
        let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('property', property)
          document.head.appendChild(meta)
        }
        meta.content = content
      }
      
      updateMeta('og:title', title)
      updateMeta('og:description', description)
      updateMeta('og:url', window.location.href)
      updateMeta('og:type', 'website')
    }
    
    updateMetaTags()
  }, [targetDateISO])

  // Effect to sync individual date inputs with the main ISO date state
  useEffect(() => {
    try {
      const date = new Date(targetDateISO);
      if (!isNaN(date.getTime())) {
        setDay(String(date.getDate()).padStart(2, '0'));
        setMonth(String(date.getMonth() + 1).padStart(2, '0'));
        setYear(String(date.getFullYear()));
      }
    } catch (e) {
      console.error("Error parsing date for inputs:", e);
    }
  }, [targetDateISO]);


  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function handleDatePartChange(part: 'day' | 'month' | 'year', value: string) {
    const englishValue = toEnglishNumerals(value);
    const numericValue = englishValue.replace(/[^0-9]/g, '');
    
    let newDay = part === 'day' ? numericValue : day;
    let newMonth = part === 'month' ? numericValue : month;
    let newYear = part === 'year' ? numericValue : year;

    // Update local state for inputs
    if (part === 'day') setDay(numericValue);
    if (part === 'month') setMonth(numericValue);
    if (part === 'year') setYear(numericValue);

    // Basic validation and date construction
    const dayNum = parseInt(newDay, 10);
    const monthNum = parseInt(newMonth, 10);
    const yearNum = parseInt(newYear, 10);

    if (dayNum > 0 && monthNum > 0 && monthNum <= 12 && String(newYear).length === 4) {
      // Clamp day to the max number of days in the given month
      const maxDays = new Date(yearNum, monthNum, 0).getDate();
      const clampedDay = Math.min(dayNum, maxDays);

      const newDate = new Date(yearNum, monthNum - 1, clampedDay);
      if (!isNaN(newDate.getTime())) {
        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (newDate < today) {
          showNotification('لا يمكن اختيار تاريخ في الماضي', 'error');
          return;
        }
        
        const newISO = newDate.toISOString().slice(0, 10);
        setTargetDateISO(newISO);
        setCookie(COOKIE_NAME, newISO);
      }
    }
  }

  function resetDate() {
    const d = defaultDateISO()
    setTargetDateISO(d)
    setCookie(COOKIE_NAME, d)
  }

  // calculate remaining time until end of the chosen day (end of day)
  const target = new Date(targetDateISO + 'T23:59:59')
  let diff = Math.max(0, target.getTime() - now.getTime())

  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  diff -= days * 24 * 60 * 60 * 1000
  const hours = Math.floor(diff / (60 * 60 * 1000))
  diff -= hours * 60 * 60 * 1000
  const minutes = Math.floor(diff / (60 * 1000))
  diff -= minutes * 60 * 1000
  const seconds = Math.floor(diff / 1000)

  // Professional canvas-based share functionality
  const shareCountdown = async () => {
    try {
      // Create canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        showNotification('خطأ: لا يمكن إنشاء Canvas', 'error')
        return
      }

      // Set canvas size for social media (Instagram post size)
      canvas.width = 1080
      canvas.height = 1080

      // Load and draw the background image
      const bgImage = new Image();
      bgImage.src = camouflageBg;
      
      await new Promise(resolve => {
        bgImage.onload = () => {
          ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
          resolve(true);
        };
        bgImage.onerror = () => {
          // Fallback to gradient if image fails to load
          const gradient = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width/2)
          gradient.addColorStop(0, '#451a03')
          gradient.addColorStop(0.4, '#78350f')
          gradient.addColorStop(1, '#1c1917')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          resolve(false); // or reject
        }
      });
      
      // Add a darker semi-transparent overlay to improve text readability
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Main content background card
      const cardX = 90
      const cardY = 150
      const cardWidth = canvas.width - 180
      const cardHeight = 780

      // Card background with subtle gradient
      const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight)
      cardGradient.addColorStop(0, 'rgba(245, 158, 11, 0.15)')
      cardGradient.addColorStop(1, 'rgba(180, 83, 9, 0.15)')
      
      ctx.fillStyle = cardGradient
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight)

      // Card border
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 3
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight)

      // Header section
      ctx.textAlign = 'center'
      ctx.fillStyle = '#fbbf24'
      
      // Main title with better typography
      ctx.font = 'bold 72px "Segoe UI", Arial, sans-serif'
      ctx.fillText('هانت يا دفعة', canvas.width / 2, 280)
      
      // Subtitle
      ctx.font = '36px "Segoe UI", Arial, sans-serif'
      ctx.fillStyle = '#fde68a'
      ctx.fillText('عدّاد نهاية الخدمة العسكرية', canvas.width / 2, 340)

      // Decorative line
      ctx.strokeStyle = '#f59e0b'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(canvas.width / 2 - 200, 370)
      ctx.lineTo(canvas.width / 2 + 200, 370)
      ctx.stroke()

      // Countdown section with professional layout
      const boxWidth = 180
      const boxHeight = 180
      const startX = (canvas.width - (4 * boxWidth + 3 * 40)) / 2
      const boxY = 450

      const countdownData = [
        { value: toArabicNumerals(days), label: 'أيام' },
        { value: toArabicNumerals(String(hours).padStart(2, '0')), label: 'ساعات' },
        { value: toArabicNumerals(String(minutes).padStart(2, '0')), label: 'دقائق' },
        { value: toArabicNumerals(String(seconds).padStart(2, '0')), label: 'ثواني' }
      ]

      countdownData.forEach((item, index) => {
        const x = startX + index * (boxWidth + 40)
        
        // Box background with gradient
        const boxGradient = ctx.createLinearGradient(x, boxY, x, boxY + boxHeight)
        //use the amber colors with low opacity for a subtle effect
      boxGradient.addColorStop(0, 'rgba(245, 158, 11, 0.25)')
      boxGradient.addColorStop(1, 'rgba(180, 83, 9, 0.25)')
        
        ctx.fillStyle = boxGradient
        ctx.fillRect(x, boxY, boxWidth, boxHeight)
        
        // Box border
        ctx.strokeStyle = '#f59e0b'
        ctx.lineWidth = 2
        ctx.strokeRect(x, boxY, boxWidth, boxHeight)
        
        // Number
        ctx.font = 'bold 64px "Segoe UI", Arial, sans-serif'
        ctx.fillStyle = '#fbbf24'
        ctx.textAlign = 'center'
        ctx.fillText(String(item.value), x + boxWidth/2, boxY + boxHeight/2 + 10)
        
        // Label
        ctx.font = 'bold 24px "Segoe UI", Arial, sans-serif'
        ctx.fillStyle = '#fde68a'
        ctx.fillText(item.label, x + boxWidth/2, boxY + boxHeight - 30)
      })

      // Bottom section
      ctx.textAlign = 'center'
      
      // Target date with better styling
      ctx.font = '32px "Segoe UI", Arial, sans-serif'
      ctx.fillStyle = '#fbbf24'
      ctx.fillText(`التاريخ المستهدف: ${formatDMY(targetDateISO)}`, canvas.width / 2, 750)

      // Professional footer
      ctx.font = '28px "Segoe UI", Arial, sans-serif'
      ctx.fillStyle = '#fde68a'
      ctx.fillText(`باقي ${toArabicNumerals(days)} يوم على انتهاء الخدمة العسكرية`, canvas.width / 2, 820)

      // Subtle branding
      ctx.font = '18px "Segoe UI", Arial, sans-serif'
      ctx.fillStyle = '#9ca3af'
      ctx.fillText('تم إنشاؤها بواسطة عدّاد الخدمة العسكرية', canvas.width / 2, 980)

      // Convert to blob and share
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          showNotification('فشل في إنشاء الصورة', 'error')
          return
        }

        // Try native sharing first (mobile)
        if (navigator.share && navigator.canShare) {
          try {
            const file = new File([blob], 'military-countdown.png', { type: 'image/png' })
            if (navigator.canShare({ files: [file] })) {
              await navigator.share({
                title: 'عدّاد نهاية الخدمة العسكرية',
                text: `باقي ${days} يوم على نهاية الخدمة!`,
                files: [file]
              })
              return
            }
          } catch (shareError) {
            console.log('Native share failed, trying fallback')
          }
        }

        // Fallback: download image
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `military-countdown-${new Date().toISOString().slice(0,10)}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        showNotification('تم حفظ الصورة بنجاح! يمكنك مشاركتها على وسائل التواصل الاجتماعي', 'success')
      }, 'image/png', 0.95)
      
    } catch (error) {
      console.error('Share failed:', error)
      showNotification(`خطأ في المشاركة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`, 'error')
    }
  }

  // Share URL with Open Graph meta tags
  const shareURL = async () => {
    try {
      const baseURL = window.location.origin + window.location.pathname;
      const shareableURL = `${baseURL}?date=${targetDateISO}`;
      
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'عدّاد نهاية الخدمة العسكرية',
            text: `باقي ${days} يوم على نهاية الخدمة! التاريخ المستهدف: ${formatDMY(targetDateISO)}`,
            url: shareableURL
          });
          return;
        } catch (shareError) {
          console.log('Native share failed, trying fallback');
        }
      }

      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareableURL);
      showNotification('تم نسخ الرابط! يمكنك مشاركته الآن', 'success');
      
    } catch (error) {
      console.error('Share URL failed:', error);
      showNotification(`خطأ في المشاركة: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`, 'error');
    }
  }

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-[url(./assets/army.jpg)] bg-cover bg-center p-4">
      <div className="backdrop-blur-lg bg-linear-to-br from-amber-900/50 to-yellow-900/60 p-6 sm:p-8 rounded-3xl text-white max-w-2xl w-full mx-auto shadow-2xl border border-amber-400/40">
        
        {/* Header with enhanced glow effect */}
        <div className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-black mb-3 relative">
            <span className="bg-linear-to-r mx-auto from-amber-200 via-amber-300 to-amber-200 bg-clip-text text-transparent drop-shadow-lg">
              هانت يا دفعة
            </span>
          </h1>
          <div className="h-1.5 bg-linear-to-r from-transparent via-amber-400 to-transparent rounded-full mb-4 max-w-xs"></div>
          <p className="text-lg sm:text-xl font-semibold text-amber-100">عدّاد نهاية الخدمة العسكرية</p>
        </div>
{/* 
        <p className="text-center text-base text-amber-100/90 mb-8 leading-relaxed ">
          اختر تاريخ نهاية الخدمة أو اقبل التاريخ الافتراضي. التاريخ محفوظ وسيستمر العدّاد في الظهور عند كل زيارة.
        </p> */}

        {/* Controls with better styling */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-10 p-4 bg-amber-900/30 rounded-2xl border border-amber-400/30">
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-amber-100 shrink-0">تاريخ النهاية:</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={toArabicNumerals(day)}
                onChange={(e) => handleDatePartChange('day', e.target.value)}
                maxLength={2}
                placeholder="يوم"
                className="w-20 px-3 py-2.5 rounded-xl text-amber-900 bg-amber-50 font-medium shadow-lg focus:ring-2 focus:ring-amber-400 transition-all text-center"
              />
              <span className="text-amber-200 font-bold">/</span>
              <input
                type="text"
                value={toArabicNumerals(month)}
                onChange={(e) => handleDatePartChange('month', e.target.value)}
                maxLength={2}
                placeholder="شهر"
                className="w-20 px-3 py-2.5 rounded-xl text-amber-900 bg-amber-50 font-medium shadow-lg focus:ring-2 focus:ring-amber-400 transition-all text-center"
              />
              <span className="text-amber-200 font-bold">/</span>
              <input
                type="text"
                value={toArabicNumerals(year)}
                onChange={(e) => handleDatePartChange('year', e.target.value)}
                maxLength={4}
                placeholder="سنة"
                className="w-28 px-3 py-2.5 rounded-xl text-amber-900 bg-amber-50 font-medium shadow-lg focus:ring-2 focus:ring-amber-400 transition-all text-center"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={resetDate} 
              className="px-5 py-2.5 bg-linear-to-r from-amber-500 to-amber-600 text-amber-900 rounded-xl font-semibold shadow-lg hover:from-amber-600 hover:to-amber-700 transform hover:scale-105 transition-all duration-200"
            >
              اختيار افتراضي
            </button>
          </div>
        </div>

        {/* Enhanced countdown display */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center mb-8">
          <div className="countdown-card">
            <div className="countdown-number">{toArabicNumerals(days)}</div>
            <div className="countdown-label">أيام</div>
          </div>
          <div className="countdown-card">
            <div className="countdown-number">{toArabicNumerals(String(hours).padStart(2, '0'))}</div>
            <div className="countdown-label">ساعات</div>
          </div>
          <div className="countdown-card">
            <div className="countdown-number">{toArabicNumerals(String(minutes).padStart(2, '0'))}</div>
            <div className="countdown-label">دقائق</div>
          </div>
          <div className="countdown-card">
            <div className="countdown-number animate-pulse">{toArabicNumerals(String(seconds).padStart(2, '0'))}</div>
            <div className="countdown-label">ثواني</div>
          </div>
        </div>

        {/* Share button and target date */}
        <div className="text-center space-y-5 ">
          <div className="flex gap-3">
            <button
              onClick={shareCountdown}
              className="flex-1 py-3.5 bg-linear-to-r from-amber-600 to-amber-700 rounded-2xl font-bold text-lg shadow-xl hover:from-amber-700 hover:to-amber-800 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 text-amber-100"
            >
              احفظ العدّاد
            </button>
            <button
              onClick={shareURL}
              className="flex-1 py-3.5 bg-linear-to-r from-amber-500 to-amber-400 rounded-2xl font-bold text-lg shadow-xl hover:from-amber-600 hover:to-amber-500 tr  ansform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 text-white"
            >
              شارك الرابط
            </button>
          </div>
          
          <p className="text-base text-amber-200/80 w-fit mx-auto">
            التاريخ المستهدف: <span className="font-bold text-amber-300 text-lg">{formatDMY(targetDateISO)}</span>
          </p>
        </div>
      </div>
      
      {/* Notification Modal */}
      <NotificationModal
        message={notification.message}
        type={notification.type}
        isOpen={notification.isOpen}
        onClose={closeNotification}
      />
    </div>
  )
}

export default App
