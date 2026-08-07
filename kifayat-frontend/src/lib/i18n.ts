import { useSyncExternalStore } from "react";

export type Lang = "en" | "ur";

const STORAGE_KEY = "kifayat:lang";

function initialLang(): Lang {
  if (typeof window === "undefined") return "en";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v === "ur" ? "ur" : "en";
  } catch {
    return "en";
  }
}

let lang: Lang = initialLang();
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function apply() {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
}

apply();

export const langStore = {
  get: () => lang,
  set: (next: Lang) => {
    if (lang === next) return;
    lang = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    apply();
    emit();
  },
  toggle: () => {
    langStore.set(lang === "en" ? "ur" : "en");
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

// Re-renders the component when the language changes.
export function useLang(): Lang {
  return useSyncExternalStore(langStore.subscribe, langStore.get, () => "en");
}

type Vars = Record<string, string | number>;

type Dict = Record<string, string>;

const en: Dict = {
  "banner.delivery": "Rs {fee} delivery — Cheapest Delivery in Pakistan",
  "banner.cod": "COD available · PKR",
  "header.help": "Help",
  "header.account": "Account",
  "header.signIn": "Sign In",
  "header.cart": "Cart",
  "search.placeholder": "Search products, brands, categories…",
  "search.submit": "Search",
  "search.suggestions": "Suggestions",
  "search.products": "Products",
  "trust.delivery": "Pakistan-wide delivery",
  "trust.cod": "Cash on delivery",
  "trust.returns": "7-day returns",
  "btn.addToBag": "Add to bag",
  "btn.outOfStock": "Out of stock",
  "hero.badge": "Season 01 — Edition",
  "hero.subline": "Quality essentials, fairly priced — dispatched Pakistan-wide.",
  "hero.cta": "Explore the Edit",
  "hero.secondary": "All products",
  "hero.deliveryBody": "2–5 working days",
  "hero.codBody": "Pay the courier",
  "hero.returnsBody": "Easy return policy",
  "hero.support": "Local support",
  "hero.supportBody": "Email & WhatsApp",
  "marquee.new": "New Arrivals",
  "products.browseHint": "Browse the full catalogue to find something considered.",
  "cart.title": "Your Bag",
  "cart.empty": "Your bag is empty.",
  "cart.emptyCta": "Browse the edit",
  "cart.subtotal": "Subtotal",
  "cart.shipping": "Shipping",
  "cart.total": "Total",
  "cart.checkout": "Proceed to checkout",
  "cart.continue": "Continue shopping",
  "cart.outOfStock": "Out of stock",
  "cart.stockIssues": "Stock issues",
  "cart.stockIssuesHint": "Some items in your bag are out of stock. Remove them to proceed.",
  "cart.codAccepted": "Cash on Delivery accepted",
  "cart.encrypted": "Encrypted data",
  // checkout
  "co.contact": "Contact",
  "co.name": "Full name",
  "co.phone": "Phone number",
  "co.phone2": "Phone number 2 (optional)",
  "co.address": "Delivery address",
  "co.addressFull": "Complete address",
  "co.addressPh": "Society, house/flat no., street, area",
  "co.city": "Courier city",
  "co.cityPh": "e.g. Karachi",
  "co.popular": "Popular cities",
  "co.summary": "Your order",
  "co.payment": "Payment",
  "co.placeOrder": "Place order — COD",
  "co.placing": "Placing order…",
  "co.codTitle": "Cash on Delivery",
  "co.codBody": "Pay the courier when your order arrives",
  "co.confirmHint": "Confirmation link sent to {email}. Must confirm within 24 hours.",
  "co.email": "your email",
  "footer.tagline": "Three considered objects, one small story, zero shouting. Unsubscribe with a single tap.",
  // footer
  "footer.letterEyebrow": "§ The Quiet Letter",
  "footer.letterTitle1": "A short note,",
  "footer.letterTitle2": "once a month",
  "footer.subscribe": "Subscribe",
  "footer.browse": "Browse",
  "footer.allItems": "All Items",
  "footer.electronics": "Electronics",
  "footer.fashion": "Fashion",
  "footer.home": "Home",
  "footer.beauty": "Beauty",
  "footer.service": "Service",
  "footer.shipping": "Shipping",
  "footer.returns": "Returns",
  "footer.reportDefective": "Report Defective",
  "footer.orders": "Orders",
  "footer.contact": "Contact",
  "footer.faq": "FAQ",
  "footer.house": "House",
  "footer.story": "Story",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.dispatch": "Dispatch",
  "footer.dispatchBody": "Pakistan-wide · 2–5 days",
  "footer.elsewhere": "Elsewhere",
  "footer.deliveryExplained": "Delivery, explained",
  "footer.payYourWay": "Pay your way",
  "footer.codBody": "Cash on delivery is available at checkout",
  "footer.needAHand": "Need a hand?",
  "footer.helpBody": "contact@kifayat.co · replies in 1–2 business days",
  "footer.madeWith": "Made with care · dispatched across Pakistan",
  "footer.backToTop": "Back to top",
};

const ur: Dict = {
  "banner.delivery": "مفت ڈیلیوری Rs 5,000 سے اوپر — پاکستان میں سب سے کم",
  "banner.cod": "کیش آن ڈیلیوری · پی کے آر",
  "header.help": "مدد",
  "header.account": "اکاؤنٹ",
  "header.signIn": "سائن اِن",
  "header.cart": "کارٹ",
  "search.placeholder": "پروڈکٹس، برانڈز، کیٹیگریز تلاش کریں…",
  "search.submit": "تلاش",
  "search.suggestions": "تجاویز",
  "search.products": "پروڈکٹس",
  "trust.delivery": "پاکستان بھر میں ڈیلیوری",
  "trust.cod": "کیش آن ڈیلیوری",
  "trust.returns": "7 دن کی واپسی",
  "btn.addToBag": "بیگ میں ڈالیں",
  "btn.outOfStock": "اسٹاک ختم",
  "hero.badge": "سیزن 01 — ایڈیشن",
  "hero.subline": "معیاری اشیاء، مناسب قیمت — پاکستان بھر میں ڈیلیوری۔",
  "hero.cta": "شاپ کریں",
  "hero.secondary": "تمام پروڈکٹس",
  "hero.deliveryBody": "2–5 کام کے دن",
  "hero.codBody": "کورئیر پر ادائیگی",
  "hero.returnsBody": "آسان واپسی پالیسی",
  "hero.support": "مقامی سپورٹ",
  "hero.supportBody": "ای میل اور واٹس ایپ",
  "marquee.new": "نئی آمدیں",
  "products.browse": "کامل کیٹلاگ میں جھانکیں۔",
  "cart.title": "آپ کا بیگ",
  "cart.empty": "آپ کا بیگ خالی ہے۔",
  "cart.emptyCta": "ایڈٹ دیکھیں",
  "cart.subtotal": "ذیلی رقم",
  "cart.shipping": "شپنگ",
  "cart.total": "کل",
  "cart.checkout": "چیک آؤٹ کریں",
  "cart.continue": "خریداری جاری رکھیں",
  "cart.outOfStock": "اسٹاک ختم",
  "cart.stockIssues": "اسٹاک کے مسائل",
  "cart.stockIssuesHint": "آپ کے بیگ میں کچھ اشیاء اسٹاک میں نہیں ہیں۔ آگے بڑھنے کے لیے انہیں ہٹائیں۔",
  "cart.codAccepted": "کیش آن ڈیلیوری قبول ہے",
  "cart.encrypted": "انکرپٹڈ ڈیٹا",
  // checkout
  "co.contact": "رابطہ",
  "co.name": "پورا نام",
  "co.phone": "فون نمبر",
  "co.phone2": "فون نمبر 2 (اختیاری)",
  "co.address": "ڈیلیوری ایڈریس",
  "co.addressFull": "مکمل ایڈریس",
  "co.addressPh": "سوسائٹی، گھر/فلیٹ نمبر، گلی، علاقہ",
  "co.city": "کورئیر شہر",
  "co.cityPh": "مثال: کراچی",
  "co.popular": "مشہور شہر",
  "co.summary": "آپ کا آرڈر",
  "co.payment": "ادائیگی",
  "co.placeOrder": "آرڈر دیں — کیش",
  "co.placing": "آرڈر ہو رہا ہے…",
  "co.codTitle": "کیش آن ڈیلیوری",
  "co.codBody": "آرڈر پہنچنے پر کورئیر کو ادائیگی کریں",
  "co.confirmHint": "تصدیق کا لنک {email} پر بھیجا گیا۔ 24 گھنٹوں میں تصدیق کریں۔",
  "co.email": "آپ کی ای میل",
  "footer.tagline": "ہر ماہ ایک بار، تین منتخب اشیاء، ایک چھوٹی کہانی — کسی شور کے بغیر۔ ایک کلک پر ان سبسکرائب۔",
  "footer.letterEyebrow": "§ خاموش خط",
  "footer.letterTitle1": "ایک مختصر خط،",
  "footer.letterTitle2": "مہینے میں ایک بار",
  "footer.subscribe": "سبسکرائب",
  "footer.browse": "مشاہدہ کریں",
  "footer.allItems": "تمام اشیاء",
  "footer.electronics": "الیکٹرانکس",
  "footer.fashion": "فیشن",
  "footer.home": "گھر",
  "footer.beauty": "بیوٹی",
  "footer.service": "خدمات",
  "footer.shipping": "شپنگ",
  "footer.returns": "واپسیاں",
  "footer.reportDefective": "نقصان کی اطلاع",
  "footer.orders": "آرڈرز",
  "footer.contact": "رابطہ",
  "footer.faq": "عمومی سوالات",
  "footer.house": "ہاؤس",
  "footer.story": "کہانی",
  "footer.privacy": "پرائیویسی",
  "footer.terms": "شرائط",
  "footer.dispatch": "سمانا",
  "footer.dispatchBody": "پاکستان بھر میں · 2–5 دن",
  "footer.elsewhere": "دوسری جگہیں",
  "footer.deliveryExplained": "ڈیلیوری کی وضاحت",
  "footer.payYourWay": "اپنی پسند کی ادائیگی",
  "footer.codBody": "چیک آؤٹ پر کیش آن ڈیلیوری دستیاب ہے",
  "footer.needAHand": "مدد چاہیے؟",
  "footer.helpBody": "contact@kifayat.co · 1–2 کاروباری دنوں میں جواب",
  "footer.madeWith": "محبت سے بنایا گیا · پاکستان بھر میں",
  "footer.backToTop": "اوپر جائیں",
};

const dicts: Record<Lang, Dict> = { en, ur };

function lookup(key: string, l: Lang, vars?: Vars): string {
  let s = dicts[l][key] ?? en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  }
  return s;
}

// Hook: returns a t bound to the current lang and re-renders on change.
export function useT() {
  const l = useLang();
  return (key: string, vars?: Vars) => lookup(key, l, vars);
}

// Non-hook translation for module scope / non-component code.
export function translate(key: string, vars?: Vars): string {
  return lookup(key, lang, vars);
}