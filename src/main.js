import { db, isFirebaseConfigured } from "./firebase.js";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";

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

const media = {
  kaaba: "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=2200&q=90",
  air: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=90",
  bus: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1600&q=90",
  hotel: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=90"
};

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
  '<div class="announcement-bar"><div class="container announcement-inner"><span><i class="announcement-dot"></i> Bahrain-based Umrah & travel assistance</span><span>Call / WhatsApp: <a href="https://wa.me/97333224271">+973 3322 4271</a><b> · </b> <a href="mailto:Alanfal-bh@hotmail.com">Alanfal-bh@hotmail.com</a></span></div></div>',
  '<header class="site-header"><div class="container nav-wrap">',
  '<a class="brand" href="#home" aria-label="Al Naseem Group home"><img src="/logo2.png" alt="Al Naseem Group logo"><span><strong>AL NASEEM GROUP</strong><small>UMRAH & TRAVEL · BAHRAIN</small></span></a>',
  '<button class="menu-toggle" aria-label="Open navigation" aria-expanded="false">☰</button>',
  '<nav class="nav-links" aria-label="Main navigation"><a href="#home">Home</a><a href="#packages">Umrah Packages</a><a id="hotel-nav-link" href="#hotels" hidden>Hotel Booking</a><a href="#guide">Umrah Guide</a><a href="#about">About Us</a><a href="#contact">Contact</a><a class="nav-cta" href="#enquiry">WhatsApp Enquiry <span>↗</span></a></nav>',
  '</div></header>',
  '<main>',
  '<section class="hero" id="home"><img class="hero-background" src="' + media.kaaba + '" alt="" fetchpriority="high"><div class="hero-overlay"></div><div class="container hero-content"><div class="hero-copy"><span class="eyebrow hero-eyebrow">YOUR JOURNEY · OUR RESPONSIBILITY</span><h1>Your journey to<br><em>the Holy Cities.</em></h1><p>Plan your Umrah journey from Bahrain with travel options by air or bus, hotel booking assistance and a team ready to help you with the next steps.</p><div class="hero-actions"><a class="button button-gold" href="#packages">Explore Umrah Packages <span>→</span></a><a class="button button-white" href="#enquiry">Speak to our team</a></div><div class="hero-meta"><span>✦ Air & road travel</span><span>✦ Makkah & Madinah stay assistance</span><span>✦ Bahrain-based support</span></div></div><div class="hero-stamp"><span>AL NASEEM GROUP</span><strong>Faith.<br>Comfort.<br>Care.</strong><small>BAHRAIN</small></div></div><div class="hero-bottom-caption">MASJID AL-HARAM · MAKKAH</div></section>',
  '<section class="trust-strip"><div class="container trust-grid"><div class="trust-item"><span class="trust-symbol">✓</span><div><strong>Trusted assistance</strong><small>Clear information and support</small></div></div><div class="trust-item"><span class="trust-symbol">✈</span><div><strong>Flexible travel options</strong><small>Packages by air and bus</small></div></div><div class="trust-item"><span class="trust-symbol">⌂</span><div><strong>Hotel booking help</strong><small>When the service is active</small></div></div><div class="trust-item"><span class="trust-symbol">◎</span><div><strong>Direct contact</strong><small>Speak with our Bahrain team</small></div></div></div></section>',
  '<section class="section services-section" id="packages"><div class="container"><div class="section-heading"><div><span class="eyebrow">CHOOSE HOW YOU TRAVEL</span><h2>Umrah packages<br><em>made easier to explore.</em></h2></div><p>Compare the available travel options below. Select a service to send your enquiry directly to our team. Final dates, inclusions and rates will be confirmed before booking.</p></div><div class="service-grid">',
  '<article class="service-card service-air"><div class="service-photo"><img src="' + media.air + '" alt="Passenger aircraft in a clear sky" loading="lazy"><span class="service-label">AIR TRAVEL</span></div><div class="service-content"><div class="service-title-row"><div><span class="service-kicker">TRAVEL BY AIR</span><h3>Umrah by Air</h3></div><span class="service-icon">✈</span></div><p>Reach the Holy Cities by air with a travel option designed for guests who prefer a flight journey.</p><div class="service-highlights"><span>✓ Flight-based travel option</span><span>✓ Convenient journey planning</span><span>✓ Team assistance for enquiries</span></div><div class="service-price-row"><div><small>Indicative price · per person</small><strong>350 BHD</strong></div><a href="#enquiry" class="service-button" data-interest="Umrah package" data-message="I would like to enquire about the Bahraini by Air Umrah package.">View package <b>→</b></a></div></div></article>',
  '<article class="service-card service-bus"><div class="service-photo"><img src="' + media.bus + '" alt="Modern long-distance coach bus on a road" loading="lazy"><span class="service-label">ROAD TRAVEL</span></div><div class="service-content"><div class="service-title-row"><div><span class="service-kicker">TRAVEL BY BUS</span><h3>Umrah by Bus</h3></div><span class="service-icon">▰</span></div><p>A road travel option for guests who prefer to travel by coach from Bahrain.</p><div class="service-highlights"><span>✓ Bus journey option</span><span>✓ Package for different traveller groups</span><span>✓ Assistance with travel enquiries</span></div><div class="bus-prices"><div><small>Bahraini</small><strong>70 BHD</strong></div><div><small>Non-Bahraini</small><strong>120 BHD</strong></div></div><div class="service-price-row"><small>Indicative price · per person</small><a href="#enquiry" class="service-button" data-interest="Umrah package" data-message="I would like to enquire about the Umrah by Bus packages.">View package <b>→</b></a></div></div></article>',
  '<article class="service-card service-hotel" id="hotel-promo-card" hidden><div class="service-photo"><img src="' + media.hotel + '" alt="Comfortable modern hotel room" loading="lazy"><span class="service-label">STAY IN COMFORT</span></div><div class="service-content"><div class="service-title-row"><div><span class="service-kicker">MAKKAH & MADINAH</span><h3>Hotel Booking</h3></div><span class="service-icon">⌂</span></div><p>Explore hotel options for your stay in the Holy Cities. Our team can help you enquire about room options and current rates.</p><div class="service-highlights"><span>✓ Hotel options shared by our team</span><span>✓ Location and room information</span><span>✓ Availability and rates on request</span></div><div class="service-price-row"><div><small>Rates and availability</small><strong>On request</strong></div><a href="#hotels" class="service-button">Explore hotels <b>→</b></a></div></div></article>',
  '</div><p class="price-note">Package prices shown are indicative reference values and may change. Confirm current pricing, travel dates, inclusions and eligibility with Al Naseem Group before making a booking.</p></div></section>',
  '<section class="hotel-section section" id="hotels" hidden><div class="container"><div class="section-heading hotel-heading"><div><span class="eyebrow">YOUR STAY IN THE HOLY CITIES</span><h2>Hotel booking<br><em>assistance.</em></h2></div><p id="hotel-intro">Explore hotel options shared by our team. Contact us to check room availability, rates and booking terms.</p></div><div class="hotel-grid" id="hotel-grid"></div><div class="hotel-bottom-note">Hotel information, room availability and rates are subject to confirmation by our team.</div></div></section>',
  '<section class="guide-section section" id="guide"><div class="container guide-layout"><div class="guide-visual"><img src="' + media.kaaba + '" alt="Masjid al-Haram and the Holy Kaaba in Makkah" loading="lazy"><div class="guide-photo-shade"></div><div class="guide-photo-label"><span>PREPARE FOR YOUR UMRAH</span><strong>A journey of faith<br>and reflection.</strong></div></div><div class="guide-copy"><span class="eyebrow">A SIMPLE OVERVIEW</span><h2>Know the steps<br><em>before you go.</em></h2><p>A short introduction to the main stages of Umrah. For detailed religious rulings, follow a qualified scholar or your authorised Umrah guide.</p><div class="steps-list" id="steps-list"></div><a class="inline-link" href="#enquiry">Need help preparing? Speak to our team <span>→</span></a></div></div></section>',
  '<section class="about-section section" id="about"><div class="container about-layout"><div><span class="eyebrow">AL NASEEM GROUP · BAHRAIN</span><h2>Personal assistance<br>for a meaningful journey.</h2></div><div><p>At Al Naseem Group, our aim is to make your Umrah planning clearer and more convenient. Explore the available travel options, ask about hotel stays and let our team guide you through the next steps.</p><div class="about-points"><span>✓ Clear package information</span><span>✓ Air and bus travel enquiries</span><span>✓ Hotel booking assistance when available</span><span>✓ Direct support from Bahrain</span></div></div></div></section>',
  '<section class="enquiry-section section" id="enquiry"><div class="container enquiry-layout"><div class="enquiry-copy"><span class="eyebrow hero-eyebrow">LET US HELP YOU PLAN</span><h2>One message can<br><em>start your journey.</em></h2><p>Tell us what you are looking for. Our team can guide you about Umrah packages, hotel options and the next steps.</p><div class="enquiry-highlights"><span>✦ Umrah package enquiries</span><span>✦ Hotel booking enquiries</span><span>✦ Travel questions and guidance</span></div><a class="enquiry-call" href="https://wa.me/97333224271">Prefer to speak directly? <strong>WhatsApp +973 3322 4271 ↗</strong></a></div><form id="enquiry-form" class="enquiry-form"><div class="form-heading"><span>CONTACT AL NASEEM GROUP</span><strong>Start your enquiry</strong><small>We will be happy to assist.</small></div><label>Your name<input name="name" required placeholder="Enter your full name"></label><label>Phone / WhatsApp<input name="phone" required type="tel" placeholder="Your contact number"></label><label>What are you interested in?<select name="interest" id="interest-select"><option value="">Select an option</option><option>Umrah package</option><option>Hotel booking</option><option>Umrah and hotel booking</option><option>General question</option></select></label><label>Message<textarea name="message" rows="3" placeholder="Travel dates or questions (optional)"></textarea></label><button class="button button-dark" type="submit">Send enquiry on WhatsApp <span>↗</span></button><small>Your message will open in WhatsApp for you to review and send.</small></form></div></section>',
  '<section class="contact-section section" id="contact"><div class="container contact-wrap"><div class="contact-intro"><span class="eyebrow">WE ARE HERE TO HELP</span><h2>Let’s plan your<br><em>next journey.</em></h2><p>From Umrah packages to hotel stays, our Bahrain team is ready to help you with clear information and personal assistance.</p><a class="contact-primary" href="https://wa.me/97333224271">Chat with our team <b>↗</b></a><div class="contact-social"><a href="https://www.youtube.com/@alanfal8033" target="_blank" rel="noreferrer">YouTube ↗</a><a href="https://whatsapp.com/channel/0029Vak1FgZC1FuGGaaUXB1A" target="_blank" rel="noreferrer">WhatsApp Channel ↗</a><a href="https://www.tiktok.com/discover/naseem-umrah-package-bahrain" target="_blank" rel="noreferrer">TikTok ↗</a></div></div><div class="contact-info-grid"><a class="contact-info-card" href="https://www.google.com/maps/search/?api=1&query=Block+215+Road+1527+Building+1068+Muharraq+Bahrain" target="_blank" rel="noreferrer"><span class="contact-card-icon">⌖</span><small>VISIT OUR OFFICE</small><strong>Find us in Muharraq</strong><p>Block 215, Road 1527, Building 1068,<br>Muharraq, Bahrain</p><b class="contact-card-link">Get directions ↗</b></a><a class="contact-info-card" href="https://wa.me/97333224271"><span class="contact-card-icon">☏</span><small>CALL / WHATSAPP</small><strong>Speak to our team</strong><p>+973 3322 4271<br>+973 3343 3533</p><b class="contact-card-link">Message us ↗</b></a><a class="contact-info-card" href="mailto:Alanfal-bh@hotmail.com"><span class="contact-card-icon">✉</span><small>EMAIL US</small><strong>Send an enquiry</strong><p>Alanfal-bh@hotmail.com</p><b class="contact-card-link">Write to us ↗</b></a><div class="contact-info-card"><span class="contact-card-icon">✦</span><small>BUSINESS DETAILS</small><strong>Al Naseem Group</strong><p>Commercial Registration<br>7601540-1 · Bahrain</p><b class="contact-card-link">Umrah & Travel Services</b></div></div></div></section>',
  '</main><footer class="site-footer"><div class="container footer-main"><div class="footer-about"><a class="footer-brand" href="#home"><img src="/logo2.png" alt="Al Naseem Group logo"><span><strong>AL NASEEM GROUP</strong><small>UMRAH & TRAVEL · BAHRAIN</small></span></a><p>Helping you plan your journey to the Holy Cities with care, clarity and personal assistance.</p></div><div class="footer-nav"><strong>EXPLORE</strong><a href="#packages">Umrah Packages</a><a href="#guide">Umrah Guide</a><a href="#about">About Us</a><a href="#contact">Contact</a></div><div class="footer-nav"><strong>OUR SERVICES</strong><a href="#packages">Umrah by Air</a><a href="#packages">Umrah by Bus</a><a href="#hotels">Hotel Booking</a><a href="#enquiry">Send an Enquiry</a></div><div class="footer-reach"><strong>GET IN TOUCH</strong><a href="https://wa.me/97333224271">+973 3322 4271</a><a href="mailto:Alanfal-bh@hotmail.com">Alanfal-bh@hotmail.com</a><a href="https://www.google.com/maps/search/?api=1&query=Block+215+Road+1527+Building+1068+Muharraq+Bahrain" target="_blank" rel="noreferrer">Muharraq, Bahrain ↗</a><a class="footer-admin" href="/admin">Staff / Admin Login ↗</a></div></div><div class="container footer-bottom"><span>© <span id="year"></span> Al Naseem Group. All rights reserved.</span><span>Commercial Registration: 7601540-1</span><span>Umrah & Travel Services · Bahrain</span></div></footer>',
  '<a class="floating-whatsapp" href="https://wa.me/97333224271" target="_blank" rel="noreferrer" aria-label="Contact Al Naseem Group on WhatsApp">◉ <span>WhatsApp</span></a>'
].join("");

document.querySelector("#app").innerHTML = page;
document.querySelector("#year").textContent = new Date().getFullYear();

// If a remote service photo cannot load, keep the card polished instead of showing
// a broken-image icon. The fallback artwork stays separate from the company logo.
function attachPhotoFallbacks(scope = document) {
  scope.querySelectorAll(".service-photo img, .hotel-empty-card img, .hotel-image-wrap img").forEach((img) => {
    img.addEventListener("error", () => {
      img.parentElement.classList.add("image-fallback");
      img.remove();
    }, { once: true });
  });
}
attachPhotoFallbacks();

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

function prepareEnquiry(interest, message) {
  const interestSelect = document.querySelector("#interest-select");
  if (interestSelect) interestSelect.value = interest || "";
  const messageBox = document.querySelector('textarea[name="message"]');
  if (messageBox && message) messageBox.value = message;
}
document.querySelectorAll("[data-interest]").forEach((link) => link.addEventListener("click", () => {
  prepareEnquiry(link.dataset.interest, link.dataset.message);
}));

document.querySelector("#enquiry-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const values = new FormData(event.currentTarget);
  const submitButton = event.currentTarget.querySelector("button[type=submit]");
  const lines = [
    "Assalamu Alaikum, I would like to make an enquiry with Al Naseem Group.",
    "Name: " + values.get("name"),
    "Phone: " + values.get("phone"),
    "Interested in: " + (values.get("interest") || "Not selected"),
    "Message: " + (values.get("message") || "—")
  ];
  const target = "https://wa.me/97333224271?text=" + encodeURIComponent(lines.join("\n"));
  submitButton.disabled = true;
  submitButton.textContent = "Saving your enquiry…";
  try {
    if (isFirebaseConfigured && db) await addDoc(collection(db, "enquiries"), {
      name: String(values.get("name") || "").trim().slice(0, 100),
      phone: String(values.get("phone") || "").trim().slice(0, 40),
      interest: String(values.get("interest") || "Not selected").slice(0, 80),
      message: String(values.get("message") || "").trim().slice(0, 1500),
      status: "new", createdAt: serverTimestamp()
    });
    window.open(target, "_blank", "noopener,noreferrer");
    submitButton.textContent = "Enquiry saved · Continue in WhatsApp";
  } catch (error) {
    console.error("Could not save enquiry:", error);
    submitButton.disabled = false;
    submitButton.textContent = "Try again · Send enquiry on WhatsApp";
    alert("We could not save your enquiry just now. Please use the direct WhatsApp link to contact our team.");
  }
});

async function loadHotelModule() {
  if (!isFirebaseConfigured || !db) return;
  try {
    const snapshot = await getDoc(doc(db, "siteModules", "hotels"));
    if (!snapshot.exists()) return;
    const data = snapshot.data();
    const hotels = Array.isArray(data.hotels) ? data.hotels : [];
    if (data.active !== true) return;

    document.querySelector("#hotel-promo-card").hidden = false;
    document.querySelector("#hotels").hidden = false;
    document.querySelector("#hotel-nav-link").hidden = false;
    document.querySelector("#hotel-intro").textContent = data.intro || "Explore hotel options shared by our team. Contact us to check room availability, rates and booking terms.";

    const hotelGrid = document.querySelector("#hotel-grid");
    if (!hotels.length) {
      hotelGrid.innerHTML = '<article class="hotel-empty-card"><img src="' + media.hotel + '" alt="Comfortable hotel room"><div><span class="service-kicker">HOTEL BOOKING ENQUIRIES</span><h3>Looking for a place to stay?</h3><p>Ask our team about hotel options in Makkah and Madinah, current availability and rates.</p><a class="service-button" href="#enquiry" data-interest="Hotel booking" data-message="I would like to enquire about hotel booking in Makkah or Madinah.">Ask about hotels <b>→</b></a></div></article>';
      attachPhotoFallbacks(hotelGrid);
      return;
    }

    hotelGrid.innerHTML = hotels.map((hotel, index) => {
      const name = escapeHtml(hotel.name || "Hotel");
      const location = escapeHtml(hotel.location || "");
      const description = escapeHtml(hotel.description || "");
      const price = escapeHtml(hotel.priceLabel || "Ask for current rates");
      const imageUrl = safeWebUrl(hotel.imageUrl) || media.hotel;
      const bookingUrl = safeWebUrl(hotel.bookingUrl);
      const button = bookingUrl
        ? '<a class="hotel-action" href="' + escapeHtml(bookingUrl) + '" target="_blank" rel="noopener noreferrer">View booking details ↗</a>'
        : '<a class="hotel-action" href="#enquiry" data-interest="Hotel booking" data-message="I would like to enquire about ' + name + '.">Enquire about this hotel →</a>';
      return '<article class="hotel-card"><div class="hotel-image-wrap"><img src="' + escapeHtml(imageUrl) + '" alt="' + name + '" loading="lazy"><span>HOTEL OPTION ' + String(index + 1).padStart(2, "0") + '</span></div><div class="hotel-card-body"><div class="hotel-location">⌖ ' + location + '</div><h3>' + name + '</h3><p>' + description + '</p><div class="hotel-card-foot"><strong>' + price + '</strong>' + button + '</div></div></article>';
    }).join("");
    attachPhotoFallbacks(hotelGrid);

    hotelGrid.querySelectorAll("[data-interest]").forEach((link) => link.addEventListener("click", () => {
      prepareEnquiry(link.dataset.interest, link.dataset.message);
    }));
  } catch (error) {
    console.warn("Hotel section could not be loaded. Hotel booking will remain hidden until the module is available.", error);
  }
}
loadHotelModule();
