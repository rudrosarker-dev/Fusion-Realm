// ————————————————————————————————————————————————
// THOLVEX STUDIO — MASTER STORE CONFIGURATION
// যেকোনো নতুন ক্লায়েন্টকে সাইট দেওয়ার সময় শুধু এই একটি ফাইল এডিট করলেই হবে!
// ————————————————————————————————————————————————

export const BRAND_CONFIG = {
  // ১. ব্র্যান্ডের নাম ও তথ্য
  brandName: "Tholvex Studio", // আপনার পছন্দের ব্র্যান্ড নাম এখানে দিন
  tagline: "Considered garments for everyday movement.",
  description: "An independent fashion house designing quiet, precise garments in heavyweight natural cloth.",

  // ২. মেটা ফেসবুক পিক্সেল ট্র্যাকিং (Facebook & Instagram Ads)
  // ক্লায়েন্টের মেটা ইভেন্ট ম্যানেজার থেকে পিক্সেল আইডি নিয়ে এখানে বসালেই ফুল ট্র্যাকিং শুরু হবে। খালি রাখলে ট্র্যাক অফ থাকবে।
  metaPixel: {
    pixelId: "123456789012345", // ক্লায়েন্টের রিয়েল পিক্সেল আইডি দিন (যেমন: "948271049281729")
    enabled: true,
  },

  // ৩. যোগাযোগ ও হেল্পলাইন
  contact: {
    phone: "+8801798994365",
    whatsappNumber: "8801798994365",
    email: "rudrosarker309@gmail.com",
    address: "Banani, Dhaka, Bangladesh",
    businessHours: "Saturday – Thursday, 10:00 – 20:00 BST",
  },

  // ৪. বিকাশ ও নগদ নম্বর (চেকআউট পেজে কাস্টমার যে নম্বরে টাকা পাঠাবে)
  payment: {
    bkashNagadNumber: "01798994365",
    accountType: "bKash & Nagad Personal",
  },

  // ৫. ডেলিভারি চার্জ
  shipping: {
    insideDhakaFee: 100,
    outsideDhakaFee: 150,
    freeShippingThreshold: 15000,
  },

  // ৬. সোশ্যাল মিডিয়া
  socials: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    tiktok: "https://tiktok.com",
    pinterest: "https://pinterest.com",
  },

  // ৭. ডেভেলপার ক্রেডিট (স্থায়ী)
  developer: {
    studioName: "Tholvex Studio",
  },
};
