import type { FaqSection, JournalPost } from "../types";
import { IMG } from "./products";

export const JOURNAL: JournalPost[] = [
  {
    slug: "how-to-manage-your-brand-journal",
    title: "How to Publish Stories in Your Atelier Journal [Template Guide]",
    eyebrow: "Editorial Guide",
    date: "2026-02-20",
    image: IMG.hero,
    excerpt:
      "A quick editorial manual for the store owner on publishing lookbooks, design notes, and fabric studies via Back Office.",
    body: [
      "[TEMPLATE GUIDANCE] This section is your brand's editorial storytelling engine. Modern luxury fashion brands don't just sell clothes; they share their creative process, fabric origin, and design philosophies to build high customer trust.",
      "As the store owner, you can edit this story or publish brand-new articles directly from your Admin Back Office (/admin) under the 'Content CMS' or 'Journal' tab. You don't need any coding knowledge.",
      "Feel free to upload campaign lookbook photos, write about your fit testing sessions, or explain why you chose specific textiles like heavy combed fleece or Italian wool.",
      "Every new story published in your Back Office will automatically sync to this page, create its own luxury reading URL, and get indexed by Google's crawler.",
    ],
  },
  {
    slug: "material-study-heavy-cotton",
    title: "Material Study — Heavy Cotton (260gsm to 480gsm)",
    eyebrow: "Fabric Archive",
    date: "2026-01-14",
    image: IMG.story,
    excerpt:
      "Why we knit our jersey at substantial grammages, and what changes when cloth carries real architectural weight.",
    body: [
      "Fabric weight is the least discussed decision in contemporary clothing, yet it is the first sensation experienced by the wearer. Below 180gsm, jersey clings and twists; at 260gsm and above, it begins to hold a clean architectural line.",
      "Our loopback fleece is knitted at 480gsm and garment-dyed, allowing color to permeate deep into the yarn after garment assembly. The result is authentic character across seams and ribbing that patinas like raw denim.",
      "Heavy cloth demands reinforced seams, resilient neck ribbing, and disciplined grading. It represents a deliberate choice for enduring longevity over disposable fashion.",
    ],
  },
  {
    slug: "inside-the-studio-eleven-fittings",
    title: "Inside The Studio — The Discipline of Eleven Fittings",
    eyebrow: "Atelier Process",
    date: "2025-12-10",
    image: IMG.collection,
    excerpt:
      "A look inside our development process where a single coat silhouette passes through eleven stand fittings before approval.",
    body: [
      "Every silhouette begins as a calico toile draped on a mannequin stand, then refined across multiple body profiles. We design not for an abstract runway ideal, but for silhouettes that drape with natural ease.",
      "Our wool overcoat underwent eleven fittings. The shawl lapel was lowered iteratively, and the drop shoulder was adjusted by precise millimetres until it hung with effortless volume.",
      "Only when a piece can be worn continuously for a week without constraint is it signed for release.",
    ],
  },
];

export const FAQS: FaqSection[] = [
  {
    title: "Orders & Verification",
    items: [
      {
        q: "How do I track my parcel status?",
        a: "Once your order is confirmed and dispatched from our studio, you will receive an automated SMS with your courier tracking reference (Steadfast / Pathao). You can also track anytime directly on our website under My Account > Track.",
      },
      {
        q: "Can I cancel or modify an order after placement?",
        a: "Orders can be modified within 2 hours of placement by contacting our atelier concierge via WhatsApp. Once dispatched for courier pickup, standard delivery protocols apply.",
      },
    ],
  },
  {
    title: "Shipping & Delivery Rates",
    items: [
      {
        q: "Where do you deliver and what are the charges?",
        a: "We provide nationwide insured courier delivery across all 64 districts in Bangladesh. Standard delivery inside Dhaka Metro is ৳100 (24–48 hours). Delivery outside Dhaka is ৳150 (2–4 working days). Orders exceeding ৳15,000 receive complimentary delivery.",
      },
      {
        q: "How does Cash on Delivery (COD) work?",
        a: "For Cash on Delivery orders, the delivery charge (৳100 inside Dhaka or ৳150 outside Dhaka) is paid in advance via bKash or Nagad. The remaining garment price is paid directly to the courier agent upon parcel delivery.",
      },
    ],
  },
  {
    title: "Returns & Exchanges",
    items: [
      {
        q: "What is your return & exchange protocol?",
        a: "Unworn garments with security tags attached in original luxury packaging qualify for a 14-day exchange or store credit protocol from the date of delivery.",
      },
    ],
  },
];

export const LEGAL: Record<string, { title: string; updated: string; body: string[] }> = {
  "shipping-policy": {
    title: "Shipping & Delivery Policy",
    updated: "Template Edition 2026",
    body: [
      "[TEMPLATE GUIDANCE FOR CLIENT] This is your store's official Shipping Policy template. You can customize the delivery charges, courier partners, and timelines anytime via your Admin Back Office (/admin) under 'Content CMS'.",
      "Nationwide Delivery Coverage: We deliver to all 64 districts across Bangladesh via insured courier partners (Steadfast Courier / Pathao).",
      "Delivery Rates & Timelines:\n• Inside Dhaka Metro: ৳100 (Delivered within 24 to 48 hours)\n• Outside Dhaka / Nationwide: ৳150 (Delivered within 2 to 4 working days)\n• Complimentary Shipping: Orders exceeding ৳15,000 receive complimentary standard delivery.",
      "Advance Delivery Fee Protocol: To prevent unverified dispatches, Cash on Delivery (COD) orders require the parcel delivery fee (৳100 inside Dhaka / ৳150 outside Dhaka) to be remitted in advance via bKash or Nagad. The garment amount is collected in cash upon physical delivery.",
    ],
  },
  "return-policy": {
    title: "14-Day Return & Exchange Policy",
    updated: "Template Edition 2026",
    body: [
      "[TEMPLATE GUIDANCE FOR CLIENT] This section details your size exchange and return protocol. Easily editable in your Back Office.",
      "14-Day Guarantee: Every garment is crafted to enduring standards. If you need a different size or silhouette, unworn garments with original atelier tags intact may be exchanged within 14 days of receipt.",
      "Eligibility Criteria: Garments must be unwashed, free of perfume or alterations, and accompanied by their original protective packaging.",
      "Exchange Coordination: Connect directly with our concierge via WhatsApp with your Order Reference ID. For Dhaka orders, doorstep exchanges can be coordinated.",
    ],
  },
  privacy: {
    title: "Privacy & Client Data Policy",
    updated: "Template Edition 2026",
    body: [
      "[TEMPLATE GUIDANCE FOR CLIENT] This privacy notice assures your customers that their data is protected with enterprise security.",
      "Client Confidentiality: We collect transactional details (name, delivery address, phone number) strictly for order fulfillment, courier consignment generation, and customer service.",
      "Data Security: Client information is never sold, shared, or rented to external marketing brokers. Data is stored on secure cloud database clusters with end-to-end encryption.",
    ],
  },
  terms: {
    title: "Terms of Service",
    updated: "Template Edition 2026",
    body: [
      "[TEMPLATE GUIDANCE FOR CLIENT] Commercial operating terms for your storefront.",
      "Orders & Fulfillment: By placing an order, you agree to these operating principles. Orders are confirmed upon verification of the advance delivery charge.",
      "Pricing & Currency: All garment prices are quoted in Bangladeshi Taka (৳ BDT) inclusive of applicable taxes.",
    ],
  },
  cookies: {
    title: "Functional Storage & Cookie Policy",
    updated: "Template Edition 2026",
    body: [
      "[TEMPLATE GUIDANCE FOR CLIENT] Storage consent policy.",
      "Essential Browser Storage: We utilize functional local storage solely to remember your bag items, wishlist pieces, and language preferences. No intrusive third-party behavioral trackers are employed.",
    ],
  },
};
