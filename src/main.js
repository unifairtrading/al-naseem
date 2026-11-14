import { db, isFirebaseConfigured } from "./firebase.js";
import { doc, getDoc } from "firebase/firestore";

const packages = [
  { name: "Bahraini by Air", price: "350 BHD", detail: "Air travel Umrah package", type: "AIR", note: "For guests who prefer to fly" },
  { name: "Bahraini by Bus", price: "70 BHD", detail: "Land travel Umrah package", type: "BUS", note: "A road journey from Bahrain" },
  { name: "Non-Bahraini by Bus", price: "120 BHD", detail: "Land travel Umrah package", type: "BUS", note: "For eligible non-Bahraini travellers" }
];

const steps = [
  ["01", "Ihram", "Prepare for Ihram and make the intention for Umrah."],
  ["02", "Tawaf", "Perform seven circuits around the Holy Kaaba."],
  ["03", "Salah", "Pray two rakahs when suitable and permitted."],
  ["04", "Zamzam", "Drink Zamzam and make dua."],
  ["05", "Sa'i", "Walk seven times between Safa and Marwah."],
  ["06", "Halq or Taqsir", "Shave or trim the hair to complete Umrah."]
];

const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

const safeWebUrl = (value) => {
  try {
    const url = new URL(String(value || ""));
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
};

const page = [
  '<div class="announcement-bar"><div class="container announcement-inner"><span><i class="announcement-dot"></i> Your Bahrain-based Umrah travel partner</span><span>Plan with care. Travel with peace of mind.</span></div></div>',
  '<header class="site-header"><div class="container nav-wrap">',
  '<a class="brand" href="#home" aria-label="Al Naseem Group home"><img src="/logo2.png" alt="Al Naseem Group"><span><strong>AL NASEEM GROUP</strong><small>UMRAH & TRAVEL · BAHRAIN</small></span></a>',
  '<button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button>',
  '<nav class="nav-links" aria-label="Main navigation"><a href="#packages">Umrah Packages</a><a id="hotel-nav-link" href="#hotels" hidden>Hotels</a><a href="#guide">Umrah Guide</a><a href="#about">About Us</a><a href="#contact">Contact</a><a class="nav-cta" href="#enquiry">Enquire Now <span>↗</span></a></nav>',
  '</div></header>',
  '<main>',
  '<section class="hero" id="home"><div class="hero-image"></div><div class="hero-overlay"></div><div class="container hero-layout"><div class="hero-copy"><span class="eyebrow light">A JOURNEY OF FAITH, MADE EASIER</span><h1>Your sacred journey<br><em>deserves thoughtful care.</em></h1><p>Explore Umrah travel options from Bahrain with clear information, helpful guidance and a team ready to assist you.</p><div class="hero-actions"><a class="button button-gold" href="#packages">Explore Umrah Packages <span>→</span></a><a class="button button-glass" href="#enquiry">Talk to our team</a></div><div class="hero-assurance"><span>✦ Air & road travel options</span><span>✦ Local assistance in Bahrain</span></div></div><aside class="hero-side-card"><span class="side-card-kicker">YOUR NEXT STEP</span><strong>Make your intention.<br>We will help with the plan.</strong><p>Tell us what you need and our team will guide you through the available options.</p><a href="#enquiry">Start an enquiry <span>↗</span></a></aside></div><div class="hero-caption">AL NASEEM GROUP <span>·</span> KINGDOM OF BAHRAIN</div></section>',
  '<section class="benefit-band"><div class="container benefit-grid"><div class="benefit-item"><span class="benefit-icon">01</span><div><strong>Umrah packages</strong><small>Air and bus travel options</small></div></div><div class="benefit-item"><span class="benefit-icon">02</span><div><strong>Helpful guidance</strong><small>Information for your journey</small></div></div><div class="benefit-item"><span class="benefit-icon">03</span><div><strong>Local assistance</strong><small>Support from Bahrain</small></div></div></div></section>',
  '<section class="section packages-section" id="packages"><div class="container"><div class="section-heading"><div><span class="eyebrow">TRAVEL OPTIONS</span><h2>Find the journey<br><em>that suits you.</em></h2></div><p>Choose an available package to begin your enquiry. Our team will confirm current dates, inclusions and final pricing with you.</p></div><div class="package-grid" id="package-grid"></div><p class="fine-print">Displayed prices are indicative reference values only. Please confirm the latest price, availability and package inclusions directly with Al Naseem Group before booking.</p></div></section>',
  '<section class="hotel-section section" id="hotels" hidden><div class="container"><div class="hotel-heading"><div><span class="eyebrow">STAY WITH COMFORT</span><h2>Hotel booking<br><em>assistance.</em></h2></div><p id="hotel-intro">Explore hotel options shared by our team. Contact us to check availability, rates and booking terms.</p></div><div class="hotel-grid" id="hotel-grid"></div><div class="hotel-bottom-note">Hotel information and availability are subject to confirmation by our team.</div></div></section>',
  '<section class="guide-section section" id="guide"><div class="container guide-layout"><div class="guide-visual"><div class="guide-photo"></div><div class="guide-photo-label"><span>THE JOURNEY OF UMRAH</span><strong>Step by step,<br>with understanding.</strong></div></div><div class="guide-copy"><span class="eyebrow">A SIMPLE OVERVIEW</span><h2>Know the steps<br><em>before you go.</em></h2><p>A short introduction to the main stages of Umrah. For detailed rulings, always follow a qualified scholar or your authorised Umrah guide.</p><div class="steps-list" id="steps-list"></div><a class="inline-link" href="#enquiry">Need help preparing? Speak to our team <span>→</span></a></div></div></section>',
  '<section class="about-section section" id="about"><div class="container about-layout"><div><span class="eyebrow">AL NASEEM GROUP · BAHRAIN</span><h2>Personal assistance<br>for a meaningful journey.</h2></div><div><p>At Al Naseem Group, we aim to make planning your Umrah journey clearer and more convenient. Explore the travel options, ask questions and let our team help you understand the next steps.</p><div class="about-points"><span>✓ Clear package information</span><span>✓ Air and bus travel enquiries</span><span>✓ Hotel booking assistance when available</span></div></div></div></section>',
  '<section class="enquiry-section section" id="enquiry"><div class="container enquiry-layout"><div class="enquiry-copy"><span class="eyebrow light">WE ARE HERE TO HELP</span><h2>Let us help you<br><em>plan your journey.</em></h2><p>Send a quick enquiry through WhatsApp. Share your preferred package or ask us about hotel options and our team can guide you.</p><div class="enquiry-highlights"><span>✦ Umrah package enquiries</span><span>✦ Hotel booking enquiries</span><span>✦ Questions about travel arrangements</span></div></div><form id="enquiry-form" class="enquiry-form"><div class="form-heading"><span>GET IN TOUCH</span><strong>Start your enquiry</strong></div><label>Your name<input name="name" required placeholder="Enter your full name"></label><label>Phone / WhatsApp<input name="phone" required type="tel" placeholder="Your contact number"></label><label>What are you interested in?<select name="interest" id="interest-select"><option value="">Select an option</option><option>Umrah package</option><option>Hotel booking</option><option>Umrah and hotel booking</option><option>General question</option></select></label><label>Message<textarea name="message" rows="3" placeholder="Travel dates or questions (optional)"></textarea></label><button class="button button-dark" type="submit">Send enquiry on WhatsApp <span>↗</span></button><small>Your message will open in WhatsApp for you to review and send.</small></form></div></section>',
  '<section class="contact-section section" id="contact"><div class="container contact-layout"><div class="contact-brand"><img src="/logo2.png" alt=""><span class="eyebrow">AL NASEEM GROUP</span><h2>We would be glad<br>to hear from you.</h2><p>For package details, hotel enquiries or general assistance, contact our team in Bahrain.</p></div><div class="contact-details"><div><span>VISIT OUR OFFICE</span><p>Block 215, Road 1527, Building 1068,<br>Muharraq, Bahrain</p></div><div><span>CALL / WHATSAPP</span><a href="https://wa.me/97333224271">+973 3322 4271</a><a href="https://wa.me/97333433533">+973 3343 3533</a></div><div><span>EMAIL</span><a href="mailto:Alanfal-bh@hotmail.com">Alanfal-bh@hotmail.com</a></div><div><span>COMMERCIAL REGISTRATION</span><p>7601540-1</p></div></div><div class="contact-social"><a href="https://www.google.com/maps/search/?api=1&query=Block+215+Road+1527+Building+1068+Muharraq+Bahrain" target="_blank" rel="noreferrer">Find us on Google Maps ↗</a><a href="https://www.youtube.com/@alanfal8033" target="_blank" rel="noreferrer">YouTube ↗</a><a href="https://whatsapp.com/channel/0029Vak1FgZC1FuGGaaUXB1A" target="_blank" rel="noreferrer">WhatsApp Channel ↗</a><a href="https://www.tiktok.com/discover/naseem-umrah-package-bahrain" target="_blank" rel="noreferrer">TikTok ↗</a></div></div></section>',
  '</main><footer><div class="container footer-inner"><span>© <span id="year"></span> Al Naseem Group. All rights reserved.</span><span>Umrah & Travel Services · Bahrain</span><a href="/admin">Staff / Admin Login ↗</a></div></footer>',
  '<a class="floating-whatsapp" href="https://wa.me/97333224271" target="_blank" rel="noreferrer" aria-label="Contact Al Naseem Group on WhatsApp">◉ <span>WhatsApp</span></a>'
].join("");

document.querySelector("#app").innerHTML = page;
document.querySelector("#year").textContent = new Date().getFullYear();

document.querySelector("#package-grid").innerHTML = packages.map((item, index) =>
  '<article class="package-card ' + (index === 1 ? "package-featured" : "") + '">' +
    '<div class="package-card-top"><span class="package-category">' + escapeHtml(item.type) + ' PACKAGE</span><span class="package-number">0' + (index + 1) + '</span></div>' +
    '<div class="package-icon">' + (item.type === "AIR" ? "✈" : "⌁") + '</div>' +
    '<h3>' + escapeHtml(item.name) + '</h3><p>' + escapeHtml(item.detail) + '</p>' +
    '<div class="package-card-bottom"><div><strong>' + escapeHtml(item.price) + '</strong><small>Indicative · per person</small></div>' +
    '<a href="#enquiry" data-package="' + escapeHtml(item.name) + '" aria-label="Enquire about ' + escapeHtml(item.name) + '">→</a></div>' +
  '</article>'
).join("");

document.querySelector("#steps-list").innerHTML = steps.map((step) =>
  '<div class="guide-step"><span>' + step[0] + '</span><div><strong>' + escapeHtml(step[1]) + '</strong><small>' + escapeHtml(step[2]) + '</small></div></div>'
).join("");

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav-links");
menuToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
}));

document.querySelectorAll("[data-package]").forEach((link) => link.addEventListener("click", () => {
  document.querySelector("#interest-select").value = "Umrah package";
  document.querySelector('textarea[name="message"]').value = "I would like to enquire about " + link.dataset.package + ".";
}));

document.querySelector("#enquiry-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const lines = [
    "Assalamu Alaikum, I would like to make an enquiry with Al Naseem Group.",
    "Name: " + values.get("name"),
    "Phone: " + values.get("phone"),
    "Interested in: " + (values.get("interest") || "Not selected"),
    "Message: " + (values.get("message") || "—")
  ];
  const target = "https://wa.me/97333224271?text=" + encodeURIComponent(lines.join("\n"));
  window.open(target, "_blank", "noopener,noreferrer");
});

async function loadHotelModule() {
  if (!isFirebaseConfigured || !db) return;
  try {
    const snapshot = await getDoc(doc(db, "siteModules", "hotels"));
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const hotels = Array.isArray(data.hotels) ? data.hotels : [];
    if (data.active !== true || hotels.length === 0) return;

    document.querySelector("#hotels").hidden = false;
    document.querySelector("#hotel-nav-link").hidden = false;
    document.querySelector("#hotel-intro").textContent = data.intro || "Explore hotel options shared by our team. Contact us to check availability, rates and booking terms.";

    const hotelGrid = document.querySelector("#hotel-grid");
    hotelGrid.innerHTML = hotels.map((hotel, index) => {
      const name = escapeHtml(hotel.name || "Hotel");
      const location = escapeHtml(hotel.location || "");
      const description = escapeHtml(hotel.description || "");
      const price = escapeHtml(hotel.priceLabel || "Ask for current rates");
      const imageUrl = safeWebUrl(hotel.imageUrl) || "/makkaa.jpg";
      const bookingUrl = safeWebUrl(hotel.bookingUrl);
      const button = bookingUrl
        ? '<a class="hotel-action" href="' + escapeHtml(bookingUrl) + '" target="_blank" rel="noopener noreferrer">View booking details ↗</a>'
        : '<a class="hotel-action" href="#enquiry" data-hotel="' + name + '">Enquire about this hotel →</a>';
      return '<article class="hotel-card"><div class="hotel-image-wrap"><img src="' + escapeHtml(imageUrl) + '" alt="' + name + '" loading="lazy"><span>HOTEL OPTION ' + String(index + 1).padStart(2, "0") + '</span></div><div class="hotel-card-body"><div class="hotel-location">⌖ ' + location + '</div><h3>' + name + '</h3><p>' + description + '</p><div class="hotel-card-foot"><strong>' + price + '</strong>' + button + '</div></div></article>';
    }).join("");

    hotelGrid.querySelectorAll("[data-hotel]").forEach((link) => link.addEventListener("click", () => {
      document.querySelector("#interest-select").value = "Hotel booking";
      document.querySelector('textarea[name="message"]').value = "I would like to enquire about " + link.dataset.hotel + ".";
    }));
  } catch (error) {
    console.warn("Hotel section could not be loaded. It will remain hidden until the module is available.", error);
  }
}
loadHotelModule();
