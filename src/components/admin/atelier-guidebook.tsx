// START OF FILE src/components/admin/atelier-guidebook.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Users,
  Boxes,
  HelpCircle,
  SlidersHorizontal,
  Bookmark,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BRAND_CONFIG } from "@/lib/brand.config";

// ওয়েব অডিও এপিআই দিয়ে খাঁটি কাগজের খসখস শব্দ তৈরি (নো এক্সটারনাল ফাইল ডিপেন্ডেন্সি)
function playPageTurnSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1400;
    filter.Q.value = 1.8;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {}
}

interface Chapter {
  id: string;
  title: string;
  tag: string;
  icon: any;
  leftPage: {
    heading: string;
    subheading: string;
    body: string[];
    tips?: string[];
  };
  rightPage: {
    heading: string;
    subheading: string;
    steps: { step: string; desc: string }[];
    highlight?: string;
  };
}

const CHAPTERS: Chapter[] = [
  {
    id: "overview",
    title: "পরিচিতি ও ড্যাশবোর্ড",
    tag: "Ch. 01",
    icon: Sparkles,
    leftPage: {
      heading: "থোলভেক্স স্টুডিও ড্যাশবোর্ড",
      subheading: "Command Overview & Operations",
      body: [
        "স্বাগতম থোলভেক্স স্টুডিওর সেন্ট্রাল ব্যাক-অফিসে। আপনার সম্পূর্ণ স্টোরটি সিঙ্গাপুর ক্লাস্টারের হাই-স্পিড Neon PostgreSQL সার্ভারলেস ডাটাবেজের সাথে সরাসরি রিয়েল-টাইমে সিঙ্ক করা।",
        "ড্যাশবোর্ডের একদম উপরে আপনি লাইভ সেলস রেভিনিউ, সক্রিয় অর্ডারের সংখ্যা এবং স্টকে কতটি পোশাক বাকি আছে তা এক নজরে দেখতে পারবেন।",
        "৭ দিন ও ৩০ দিনের রেভিনিউ গ্রাফে মাউস নিলে নির্দিষ্ট দিনের মোট বিক্রি এবং অর্ডারের সংখ্যা বিস্তারিত ফুটে উঠবে।",
      ],
      tips: [
        "অ্যাডমিন ও স্টাফ প্যানেলের ডাটা প্রতি সেকেন্ডে লাইভ রিফ্রেশ হয়।",
        "ক্যাশ অন ডেলিভারি এবং ফুল পেমেন্ট ট্রানজেকশন আলাদাভাবে ট্র্যাকিং হয়।",
      ],
    },
    rightPage: {
      heading: "দৈনিক কাজের ফ্লো",
      subheading: "Daily Atelier Workflow",
      steps: [
        {
          step: "১. নতুন অর্ডার চেক",
          desc: "Orders ট্যাবে গিয়ে 'Pending' অর্ডারের তালিকা এবং TrxID যাচাই করুন।",
        },
        {
          step: "২. কুরিয়ার বুকিং",
          desc: "কাস্টমারের নাম-ঠিকানা না লিখে এক ক্লিকে Steadfast-এ পার্সেল পাঠান।",
        },
        {
          step: "৩. চালান প্রিন্ট",
          desc: "পার্সেল প্যাকেটের ওপর লাগানোর জন্য প্যাকিং স্লিপ প্রিন্ট করুন।",
        },
        {
          step: "৪. কার্ট রিকভারি",
          desc: "অ্যাবান্ডন্ড কার্ট সেকশন থেকে ক্রেতাকে ১-ক্লিকে হোয়াটসঅ্যাপ করুন।",
        },
      ],
      highlight: "নিয়মিত ড্যাশবোর্ড পর্যবেক্ষণে আপনার ব্যবসার সেলস ও ইনভেন্টরি ১০০% নিয়ন্ত্রণে থাকবে।",
    },
  },
  {
    id: "courier",
    title: "কুরিয়ার বুকিং ও ইনভয়েস",
    tag: "Ch. 02",
    icon: Truck,
    leftPage: {
      heading: "১-ক্লিকে স্টেডফাস্ট বুকিং",
      subheading: "Steadfast Courier Dispatch Engine",
      body: [
        "আপনাকে আর স্টেডফাস্টের ওয়েবসাইটে লগইন করে কাস্টমারের নাম, ফোন নম্বর বা দীর্ঘ ঠিকানা কপি-পেস্ট করতে হবে না।",
        "যেকোনো অর্ডারের পাশে 'Invoice' অথবা 'Slip & Courier' বাটনে চাপ দিলেই স্বয়ংক্রিয়ভাবে একটি অফিসিয়াল প্যাকিং স্লিপ ওপেন হবে।",
        "সেখানে থাকা 'Book Courier' বাটনে একবার ক্লিক করলেই সাথে সাথে স্টেডফাস্ট সার্ভার থেকে একটি কনসাইনমেন্ট ট্র্যাকিং কোড (যেমন: STDF-XXXXXX) চলে আসবে।",
      ],
      tips: [
        "বুকিং সফল হলে স্বয়ংক্রিয়ভাবে অর্ডারের স্ট্যাটাস 'SHIPPED' হয়ে যাবে।",
        "কাস্টমারের ফোনে তাৎক্ষণিকভাবে ট্র্যাকিং কোড সহ ডেলিভারি SMS চলে যাবে।",
      ],
    },
    rightPage: {
      heading: "চালান প্রিন্ট ও ক্যাশ কালেকশন",
      subheading: "Collection Slip Guidelines",
      steps: [
        {
          step: "১. কালেকশন অ্যামাউন্ট",
          desc: "কুরিয়ার কত টাকা ক্যাশ সংগ্রহ করবে তা 'Cash to Collect' বক্সে বড় করে প্রদর্শিত থাকে।",
        },
        {
          step: "২. অ্যাডভান্স ডেলিভারি ফি",
          desc: "কাস্টমার পূর্বে বিকাশ/নগদে যে ডেলিভারি ফি (৳১০০/৳১৫০) দিয়েছে, তা মোট মূল্য থেকে অটোমেটিক বাদ যাবে।",
        },
        {
          step: "৩. প্রিন্ট প্যাকিং স্লিপ",
          desc: "'Print Packing Slip' বাটনে চাপ দিয়ে মেমোটি প্যাক করা বক্সে স্ট্যাপল করুন।",
        },
      ],
      highlight: "পার্সেল ডেলিভারি হয়ে গেলে স্ট্যাটাস ড্রপডাউন থেকে 'Delivered' মার্ক করুন।",
    },
  },
  {
    id: "fraud",
    title: "ফ্রড প্রটেকশন ও ব্ল্যাকলিস্ট",
    tag: "Ch. 03",
    icon: ShieldCheck,
    leftPage: {
      heading: "প্রতারক কাস্টমার শনাক্তকরণ",
      subheading: "Fraud Score & Trust Analysis",
      body: [
        "বাংলাদেশে ক্লোদিং ব্র্যান্ডগুলোর সবচেয়ে বড় ক্ষতি হয় ফেইক অর্ডার ও পার্সেল রিজেকশনের কারণে। থোলভেক্স স্টুডিওতে রয়েছে স্বয়ংক্রিয় ফ্রড ডিটেকশন সিস্টেম।",
        "অর্ডারের স্লিপ খুললেই সিস্টেম কাস্টমারের ফোন নম্বরের ওপর ভিত্তি করে তার অতীত ইতিহাস বিশ্লেষণ করে একটি স্কোর দেয় (০% থেকে ১০০%):",
        "🟢 ৯৫% Safe Customer: নিয়মিত পার্সেল রিসিভ করে। নিশ্চিন্তে পাঠান।\n🟡 Moderate Risk: নতুন ক্রেতা। ফোনে কথা বলে কনফার্ম করুন।\n🔴 Critical / High Risk: পূর্বে একাধিকবার পার্সেল ফেরত দিয়েছে!",
      ],
      tips: [
        "উচ্চ ঝুঁকির ক্রেতাদের ক্ষেত্রে কুরিয়ার চার্জ বা পুরো মূল্য অগ্রিম নেওয়া বুদ্ধিমানের কাজ।",
      ],
    },
    rightPage: {
      heading: "১-ক্লিকে ব্ল্যাকলিস্ট",
      subheading: "One-Click Customer Blacklisting",
      steps: [
        {
          step: "১. ব্ল্যাকলিস্ট করা",
          desc: "সন্দেহজনক অর্ডারের ভেতরে থাকা '🚫 Blacklist Customer' বাটনে চাপ দিন।",
        },
        {
          step: "২. সাইটে অটোমেটিক লক",
          desc: "ভবিষ্যতে ওই নম্বরে কেউ আবার কেনাকাটা করতে গেলে ক্যাশ অন ডেলিভারি (COD) বন্ধ হয়ে যাবে।",
        },
        {
          step: "৩. ব্ল্যাকলিস্ট প্রত্যাহার",
          desc: "কোনো ভুল হলে '✓ Unblock Customer' বাটনে চাপ দিলেই সাথে সাথে নম্বরটি স্বাভাবিক হয়ে যাবে।",
        },
      ],
      highlight: "এই ফিচারটি আপনার ব্যবসার মাসিক হাজার হাজার টাকার রিটার্ন কুরিয়ার ক্ষতি প্রতিরোধ করবে।",
    },
  },
  {
    id: "offline",
    title: "মেসেঞ্জার ও অফলাইন অর্ডার",
    tag: "Ch. 04",
    icon: ShoppingBag,
    leftPage: {
      heading: "১৫ সেকেন্ডে দ্রুত অর্ডার এন্ট্রি",
      subheading: "Social Commerce & Offline Orders",
      body: [
        "অনেক ক্রেতা সরাসরি ওয়েবসাইটে কেনাকাটা না করে ফেসবুক পেজ, ইনস্টাগ্রাম বা হোয়াটসঅ্যাপে মেসেজ দিয়ে অর্ডার করে থাকে।",
        "অ্যাডমিন বা স্টাফ প্যানেলের 'Quick Offline Order' বাটনে ক্লিক করে আপনি মাত্র ১৫ সেকেন্ডের মধ্যে মেসেঞ্জারের অর্ডারটি ডাটাবেজে রেকর্ড করতে পারবেন।",
        "প্রোডাক্ট ও সাইজ সিলেক্ট করার সাথে সাথেই সিস্টেম লাইভ ডাটাবেজ থেকে স্বয়ংক্রিয়ভাবে স্টক বিয়োগ করে ফেলবে!",
      ],
      tips: [
        "অগ্রিম ডেলিভারি ফি নেওয়া হলে তা 'Advance Paid' ঘরে লিখে দিন।",
        "ক্যাশ অন ডেলিভারির বাকি টাকা স্বয়ংক্রিয়ভাবে ক্যালকুলেট হয়ে যাবে।",
      ],
    },
    rightPage: {
      heading: "অ্যাবান্ডন্ড কার্ট রিকভারি",
      subheading: "Abandoned Cart WhatsApp Recovery",
      steps: [
        {
          step: "১. ড্রাফট কার্ট পরীক্ষা",
          desc: "Orders > Abandoned Carts ট্যাবে যান। যারা কেনার শেষ মুহূর্তে থেমে গেছে তাদের লিস্ট পাবেন।",
        },
        {
          step: "২. রিকভার বাটনে চাপ",
          desc: "এক ক্লিকে 'Recover' বাটনে চাপ দিন। সরাসরি হোয়াটসঅ্যাপ ওয়েব ওপেন হবে।",
        },
        {
          step: "৩. রেডি মেসেজ পাঠান",
          desc: "তার ব্যাগে কোন কোন পোশাক ছিল তা সহ একটি প্রি-টাইপড লাক্সারি মেসেজ তৈরি থাকবে। স্রেফ সেন্ড করুন!",
        },
      ],
      highlight: "অ্যাবান্ডন্ড কার্ট নিয়মিত রিকভার করলে দোকানের মোট বিক্রি ২০% থেকে ৩৫% বৃদ্ধি পায়।",
    },
  },
  {
    id: "products",
    title: "প্রোডাক্ট ও ইনভেন্টরি",
    tag: "Ch. 05",
    icon: Boxes,
    leftPage: {
      heading: "নতুন পোশাক আপলোড ও সাইজ স্টক",
      subheading: "Garments Catalog & Size Matrix",
      body: [
        "Products ট্যাবে গিয়ে 'Add Product' বাটনে ক্লিক করে যেকোনো নতুন কালেকশন আপলোড করা যায়।",
        "পোশাকের ছবি যুক্ত করার জন্য ছবিটিকে সরাসরি ড্র্যাগ-অ্যান্ড-ড্রপ করুন। সিস্টেম স্বয়ংক্রিয়ভাবে ছবিটিকে অপ্টিমাইজড করে নেবে।",
        "প্রতিটি সাইজের (XS, S, M, L, XL, XXL) আলাদা আলাদা স্টক সংখ্যা ইনপুট দিন। কোনো সাইজের স্টক শূন্য হলে সাইটে স্বয়ংক্রিয়ভাবে তা 'Sold Out' দেখাবে।",
      ],
      tips: [
        "ম্যাজিক বাই লিংক: প্রোডাক্টের পাশের স্পার্কল (✨) আইকনে চাপ দিলে ১-ক্লিক ডিরেক্ট বাই লিংক কপি হয়, যা ফেসবুকে শেয়ার করা যায়।",
      ],
    },
    rightPage: {
      heading: "ইনভেন্টরি কন্ট্রোল ও অ্যালার্ট",
      subheading: "Live Stock Matrix Management",
      steps: [
        {
          step: "১. ইনভেন্টরি ফিল্টার",
          desc: "Inventory ট্যাবে All Stock, Low Stock এবং Sold Out ফিল্টারের মাধ্যমে স্টক মনিটর করুন।",
        },
        {
          step: "২. সাইজ অনুযায়ী স্টক এডিট",
          desc: "নতুন স্টক কারখানা থেকে আসলে 'Edit Stock' বাটনে চেপে নির্দিষ্ট সাইজের সংখ্যা বাড়িয়ে দিন।",
        },
        {
          step: "৩. ফ্ল্যাগ ম্যানেজমেন্ট",
          desc: "হোমপেজের সামনে রাখতে 'Featured', 'New Arrival' বা 'Best Seller' চেকবক্স টিক দিন।",
        },
      ],
      highlight: "ইনভেন্টরি সম্পূর্ণ অটোমেটেড—ওয়েবসাইটে কোনো ক্রেতা অর্ডার করলেই ডাটাবেজ থেকে তৎক্ষণাৎ স্টক মাইনাস হয়।",
    },
  },
  {
    id: "crm",
    title: "কুপন, সিআরএম ও সিএমএস",
    tag: "Ch. 06",
    icon: Users,
    leftPage: {
      heading: "কুপন ভাউচার ও ক্লায়েন্ট সিআরএম",
      subheading: "Promotions & Customer Relations",
      body: [
        "Discounts ট্যাবে গিয়ে 'Create Coupon' দিয়ে আপনি স্পেশাল অফার কোড তৈরি করতে পারবেন (যেমন: EID26, FLAT500)। এটি শতাংশে (%) বা নির্দিষ্ট অঙ্কে (৳) ডিসকাউন্ট দেয়।",
        "Customers ট্যাবে প্রতিটি ক্রেতার আজীবনের খরচের পরিমাণ (Total Spend) এবং কতবার কেনাকাটা করেছে তার হিসেব থাকে।",
        "সিস্টেম স্বয়ংক্রিয়ভাবে লয়াল ক্রেতাদের 'VIP Client' এবং 'Repeat Buyer' সোনালী ব্যাজ প্রদান করে।",
      ],
      tips: [
        "ভিআইপি ক্লায়েন্টদের ফোন বা মেসেজ দিয়ে নতুন কালেকশনের আগাম তথ্য দেওয়া যায়।",
      ],
    },
    rightPage: {
      heading: "ব্যানার ও সাইট কন্টেন্ট পরিবর্তন",
      subheading: "Visual CMS & Mode Switcher",
      steps: [
        {
          step: "১. ব্যানার পরিবর্তন",
          desc: "Banners CMS থেকে হোমপেজ ও ক্যাটাগরির মূল ফটো ড্র্যাগ করে পরিবর্তন করুন।",
        },
        {
          step: "২. হোমপেজ মোড",
          desc: "Content CMS থেকে ওয়েবসাইটকে 'Luxury Lookbook' অথবা সরাসরি 'Direct Shop' মোডে নেওয়া যায়।",
        },
        {
          step: "৩. পলিসি ও এফএকিউ",
          desc: "রিটার্ন পলিসি, ডেলিভারি রুলস এবং সচরাচর জিজ্ঞাসিত প্রশ্নাবলি (FAQ) কোড ছাড়াই এডিট করুন।",
        },
      ],
      highlight: "থোলভেক্স স্টুডিও সম্পূর্ণ স্বাবলম্বী—যেকোনো ব্যানার বা টেক্সট পরিবর্তনের জন্য প্রোগ্রামারের প্রয়োজন নেই।",
    },
  },
];

export function AtelierGuidebookModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(0); // 0 = Cover, 1..N = Chapters, Last = Back Cover
  const [isFlipping, setIsFlipping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);

  const totalPages = CHAPTERS.length + 2; // Cover + Chapters + Back Cover

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, currentPage, isFlipping]);

  const nextPage = () => {
    if (currentPage >= totalPages - 1 || isFlipping) return;
    if (soundEnabled) playPageTurnSound();
    setIsFlipping(true);
    setCurrentPage((p) => p + 1);
    setTimeout(() => setIsFlipping(false), 550);
  };

  const prevPage = () => {
    if (currentPage <= 0 || isFlipping) return;
    if (soundEnabled) playPageTurnSound();
    setIsFlipping(true);
    setCurrentPage((p) => p - 1);
    setTimeout(() => setIsFlipping(false), 550);
  };

  const jumpToChapter = (index: number) => {
    if (isFlipping) return;
    if (soundEnabled) playPageTurnSound();
    setIsFlipping(true);
    setCurrentPage(index + 1);
    setTimeout(() => setIsFlipping(false), 550);
  };

  // মাউস ও টাচ ড্র্যাগ হ্যান্ডলার (বাস্তবসম্মত কোণা ভাঁজ হওয়ার ফিজিক্স)
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
    setDragProgress(0);
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const delta = dragStartX.current - clientX;
    const percent = Math.max(-100, Math.min(100, (delta / 250) * 100));
    setDragProgress(percent);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragProgress > 28) {
      nextPage();
    } else if (dragProgress < -28) {
      prevPage();
    }
    setDragProgress(0);
  };

  if (!open) return null;

  const currentChapter = currentPage > 0 && currentPage <= CHAPTERS.length ? CHAPTERS[currentPage - 1] : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 select-none"
    >
      {/* টপ ফ্লোটিং কন্ট্রোল বার */}
      <div className="absolute top-4 inset-x-4 sm:inset-x-8 flex items-center justify-between text-paper z-20">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/10 border border-white/15 text-gold-light">
            <BookOpen className="size-4" />
          </span>
          <div>
            <p className="text-[11px] font-mono uppercase tracking-[0.22em] text-[#dfcaa8]">
              {BRAND_CONFIG.brandName} Atelier Dossier
            </p>
            <p className="text-[10px] text-paper/50 font-mono">
              Master Operations Manual • Page {currentPage + 1} of {totalPages}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 border border-white/15 text-paper/70 hover:text-white transition-colors cursor-pointer"
            title={soundEnabled ? "Mute Flip Sound" : "Enable Sound"}
          >
            {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 border border-white/15 text-paper/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
            title="Close Manual"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      {/* ——— মেইন থ্রি-ডি বুক কন্টেইনার ——— */}
      <div
        className="relative w-full max-w-5xl h-[78vh] sm:h-[82vh] max-h-[700px] flex items-center justify-center perspective-[2000px]"
        onMouseDown={handleTouchStart}
        onMouseMove={handleTouchMove}
        onMouseUp={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* বইয়ের হার্ডকভার চামড়া/কাপড়ের ছায়া ও ৩-ডি ডেপথ */}
        <div className="relative w-full h-full flex rounded-lg shadow-[0_30px_90px_rgba(0,0,0,0.8),0_10px_30px_rgba(0,0,0,0.5)] border border-[#3b3226] bg-[#12100d] overflow-hidden">

          {/* ১. কভার পেজ (Hardcover Presentation) */}
          {currentPage === 0 && (
            <div className="relative size-full flex flex-col items-center justify-center p-8 sm:p-14 text-center bg-gradient-to-br from-[#1a1714] via-[#0e0d0b] to-[#070605] text-paper border-8 border-[#262019]">
              <div className="absolute inset-4 border border-[#c5a880]/30 pointer-events-none" />
              <div className="absolute inset-6 border border-[#c5a880]/15 pointer-events-none" />

              <div className="size-16 sm:size-20 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] mb-6 shadow-[0_0_20px_rgba(197,168,128,0.2)]">
                <BookOpen className="size-8 sm:size-10" strokeWidth={1.25} />
              </div>

              <p className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.35em] text-[#dfcaa8] mb-3">
                Official Operational Handbook
              </p>
              <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl tracking-tight text-paper max-w-xl">
                Atelier Master Manual
              </h1>
              <p className="mt-4 max-w-md text-xs sm:text-sm text-paper/60 font-light leading-relaxed">
                Complete operating guide for store owners: from handling orders and courier dispatch to stock control and fraud protection.
              </p>

              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={nextPage}
                  className="inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#f6f3eb] text-[#0e0d0b] text-[11px] font-bold uppercase tracking-[0.2em] rounded-xs shadow-lg hover:bg-[#dfcaa8] transition-all cursor-pointer hover:scale-105 active:scale-95"
                >
                  <span>Open Manual (বইটি খুলুন)</span>
                  <ChevronRight className="size-4" />
                </button>
              </div>

              <p className="absolute bottom-10 font-mono text-[9px] uppercase tracking-[0.22em] text-paper/30">
                Click or drag edge to turn pages
              </p>
            </div>
          )}

          {/* ২. বইয়ের ভেতরের স্প্রেড (Two-Page Luxury Spread on Desktop, One-Page on Mobile) */}
          {currentChapter && (
            <div className="relative size-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-black/15 bg-[#f6f3eb] text-[#0e0d0b]">
              
              {/* বইয়ের মাঝের বাঁধানো ভাঁজ (Center Spine Shadow) */}
              <div
                className="hidden md:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-12 pointer-events-none z-10 bg-gradient-to-r from-black/15 via-black/25 to-black/15"
                aria-hidden
              />

              {/* বাম পৃষ্ঠা (Left Page: Overview & Concepts) */}
              <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-y-auto thin-scroll">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-black/10 pb-3">
                    <span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase font-bold tracking-[0.2em] text-[#9e7f55]">
                      <currentChapter.icon className="size-3.5" />
                      {currentChapter.tag} • {currentChapter.title}
                    </span>
                    <span className="font-mono text-[10px] text-black/40">Page {currentPage * 2 - 1}</span>
                  </div>

                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">
                      {currentChapter.leftPage.heading}
                    </h2>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-black/50 mt-1">
                      {currentChapter.leftPage.subheading}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 text-xs sm:text-[13px] leading-relaxed text-[#2c2824] font-light">
                    {currentChapter.leftPage.body.map((p, i) => (
                      <p key={i} className="whitespace-pre-line">{p}</p>
                    ))}
                  </div>

                  {currentChapter.leftPage.tips && (
                    <div className="mt-4 border border-[#c5a880]/40 bg-[#c5a880]/10 p-3.5 rounded-xs space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#7a5e38] font-mono">
                        💡 প্রো-টিপস (Pro-Tip)
                      </p>
                      {currentChapter.leftPage.tips.map((tip, i) => (
                        <p key={i} className="text-xs text-[#3b3226] leading-relaxed">• {tip}</p>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-black/10 flex items-center justify-between text-[10px] font-mono text-black/40">
                  <span>{BRAND_CONFIG.brandName} Atelier</span>
                  <span>Turn Left ←</span>
                </div>
              </div>

              {/* ডান পৃষ্ঠা (Right Page: Step-by-Step Instructions) */}
              <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col justify-between overflow-y-auto thin-scroll bg-[#f3efe4]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-black/10 pb-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-black/40">
                      Step-by-Step Operating Guide
                    </span>
                    <span className="font-mono text-[10px] text-black/40">Page {currentPage * 2}</span>
                  </div>

                  <div>
                    <h3 className="font-display text-2xl sm:text-3xl text-ink tracking-tight">
                      {currentChapter.rightPage.heading}
                    </h3>
                    <p className="text-[10px] uppercase font-mono tracking-wider text-black/50 mt-1">
                      {currentChapter.rightPage.subheading}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    {currentChapter.rightPage.steps.map((st, i) => (
                      <div key={i} className="border border-black/10 bg-white/60 p-3 rounded-xs shadow-2xs space-y-1">
                        <p className="text-xs font-bold text-ink">{st.step}</p>
                        <p className="text-[11px] text-black/70 leading-relaxed font-light">{st.desc}</p>
                      </div>
                    ))}
                  </div>

                  {currentChapter.rightPage.highlight && (
                    <div className="mt-4 border-l-2 border-[#9e7f55] pl-3 py-1 text-xs italic text-black/75">
                      “{currentChapter.rightPage.highlight}”
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-black/10 flex items-center justify-between text-[10px] font-mono text-black/40">
                  <span>Drag corner to turn</span>
                  <span>Turn Right →</span>
                </div>
              </div>
            </div>
          )}

          {/* ৩. ব্যাক কভার (Back Cover) */}
          {currentPage === totalPages - 1 && (
            <div className="relative size-full flex flex-col items-center justify-center p-8 sm:p-14 text-center bg-gradient-to-br from-[#1a1714] via-[#0e0d0b] to-[#070605] text-paper border-8 border-[#262019]">
              <div className="absolute inset-4 border border-[#c5a880]/30 pointer-events-none" />

              <div className="size-14 rounded-full border border-[#c5a880]/40 flex items-center justify-center text-[#c5a880] mb-4">
                <Bookmark className="size-6" />
              </div>

              <h2 className="font-display text-3xl sm:text-4xl text-paper">
                End of Operating Manual
              </h2>
              <p className="mt-3 max-w-md text-xs sm:text-sm text-paper/60 font-light leading-relaxed">
                আপনার ওয়েবসাইট হস্তান্তরের পর কোনো সহায়তার প্রয়োজন হলে যেকোনো সময় আমাদের সাথে যোগাযোগ করতে পারেন।
              </p>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage(0)}
                  className="px-6 py-3 bg-[#f6f3eb] text-[#0e0d0b] text-[11px] font-bold uppercase tracking-[0.2em] rounded-xs shadow-md hover:bg-[#dfcaa8] transition-all cursor-pointer"
                >
                  প্রথম পৃষ্ঠায় ফিরুন
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-white/20 text-white text-[11px] font-semibold uppercase tracking-[0.2em] rounded-xs hover:bg-white/10 transition-all cursor-pointer"
                >
                  ম্যানুয়াল বন্ধ করুন
                </button>
              </div>
            </div>
          )}

          {/* কাগজের ডায়নামিক ড্র্যাগ কার্ল শ্যাডো (Drag Corner Curl Effect) */}
          {isDragging && Math.abs(dragProgress) > 5 && (
            <div
              style={{
                opacity: Math.min(0.65, Math.abs(dragProgress) / 100),
                transform: `translateX(${dragProgress > 0 ? 100 - dragProgress : -100 - dragProgress}%)`,
              }}
              className="absolute inset-0 pointer-events-none z-30 bg-gradient-to-r from-transparent via-black/40 to-black/80 transition-opacity"
            />
          )}
        </div>

        {/* ফ্লিপ কন্ট্রোল বোতাম (বামে ও ডানে নেভিগেশন) */}
        {currentPage > 0 && (
          <button
            type="button"
            onClick={prevPage}
            className="absolute left-2 sm:-left-6 top-1/2 -translate-y-1/2 size-10 sm:size-12 rounded-full bg-paper/90 text-ink shadow-2xl flex items-center justify-center border border-line hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
            aria-label="Previous Page"
          >
            <ChevronLeft className="size-6" />
          </button>
        )}

        {currentPage < totalPages - 1 && (
          <button
            type="button"
            onClick={nextPage}
            className="absolute right-2 sm:-right-6 top-1/2 -translate-y-1/2 size-10 sm:size-12 rounded-full bg-paper/90 text-ink shadow-2xl flex items-center justify-center border border-line hover:scale-110 active:scale-95 transition-all z-40 cursor-pointer"
            aria-label="Next Page"
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {/* ——— চ্যাপ্টার বুকমার্ক রিবন (সরাসরি অধ্যায়ে যাওয়ার শর্টকাট) ——— */}
      <div className="absolute bottom-4 inset-x-4 flex items-center justify-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar z-20">
        <button
          type="button"
          onClick={() => setCurrentPage(0)}
          className={cn(
            "px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-xs",
            currentPage === 0
              ? "bg-[#c5a880] text-black font-bold"
              : "bg-black/60 text-paper/70 hover:text-white border border-white/10"
          )}
        >
          প্রচ্ছদ (Cover)
        </button>

        {CHAPTERS.map((ch, idx) => (
          <button
            key={ch.id}
            type="button"
            onClick={() => jumpToChapter(idx)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-xs",
              currentPage === idx + 1
                ? "bg-[#c5a880] text-black font-bold"
                : "bg-black/60 text-paper/70 hover:text-white border border-white/10"
            )}
          >
            {ch.tag}: {ch.title}
          </button>
        ))}
      </div>
    </div>
  );
}
// END OF FILE src/components/admin/atelier-guidebook.tsx
