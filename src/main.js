import "./styles.css";
import { isFirebaseConfigured } from "./firebase.js";

const packages = [
  { name: "Bahraini by Air", price: "350 BHD", detail: "Air travel Umrah package", tag: "By Air" },
  { name: "Bahraini by Bus", price: "70 BHD", detail: "Land travel Umrah package", tag: "By Bus" },
  { name: "Non-Bahraini by Bus", price: "120 BHD", detail: "Land travel Umrah package", tag: "By Bus" },
];
const steps = [
  ["01","Ihram","Prepare for Ihram and make the intention for Umrah."],
  ["02","Tawaf","Perform seven circuits around the Holy Kaaba."],
  ["03","Salah","Pray two rak'ahs when suitable and permitted."],
  ["04","Zamzam","Drink Zamzam and make dua."],
  ["05","Sa'i","Walk seven times between Safa and Marwah."],
  ["06","Halq or Taqsir","Shave or trim the hair to complete Umrah."]
];

document.querySelector("#app").innerHTML = `
<div class="topbar"><div class="container topbar-inner"><span>Umrah services from Bahrain</span><span>Plan your journey with Al Naseem Group</span></div></div>
<header class="site-header"><div class="container nav-wrap">
<a class="brand" href="#home"><img src="/logo2.png" alt="Al Naseem Group logo"><span><strong>AL NASEEM GROUP</strong><small>UMRAH SERVICES · BAHRAIN</small></span></a>
<button class="menu-toggle" aria-label="Toggle navigation" aria-expanded="false">☰</button>
<nav class="nav-links"><a href="#packages">Packages</a><a href="#steps">Umrah Guide</a><a href="#feedback">Guest Feedback</a><a href="#contact">Contact</a><a class="nav-cta" href="#enquiry">Enquire Now</a></nav>
</div></header>
<main>
<section class="hero" id="home"><div class="hero-shade"></div><div class="container hero-content"><span class="eyebrow">YOUR JOURNEY, OUR CARE</span><h1>A blessed journey<br><em>begins with a plan.</em></h1><p>Making your Umrah journey from Bahrain simpler, clearer and more comfortable.</p><div class="hero-actions"><a class="button button-gold" href="#packages">Explore Packages</a><a class="button button-outline" href="#steps">Umrah Guide</a></div></div><div class="hero-note">AL NASEEM GROUP · BAHRAIN</div></section>
<section class="trust-strip"><div class="container trust-grid"><div><strong>Umrah Packages</strong><span>Air & bus options</span></div><div><strong>Based in Bahrain</strong><span>Local assistance</span></div><div><strong>Personal Guidance</strong><span>Support for your journey</span></div></div></section>
<section class="section" id="packages"><div class="container"><div class="section-heading"><span class="eyebrow">CHOOSE YOUR JOURNEY</span><h2>Our Umrah Packages</h2><p>Explore the available travel options. Final inclusions, dates and prices will be confirmed by our team.</p></div><div class="package-grid">${packages.map((p,i)=>`<article class="package-card ${i===1?"featured":""}"><span class="package-tag">${p.tag}</span><h3>${p.name}</h3><p>${p.detail}</p><div class="price">${p.price}<small> / person · indicative</small></div><a class="text-link" href="#enquiry" data-package="${p.name}">Enquire about this package <span>→</span></a></article>`).join("")}</div><p class="notice">Prices are preliminary reference values and must be confirmed before publication or booking.</p></div></section>
<section class="guide-section section" id="steps"><div class="container"><div class="section-heading"><span class="eyebrow">A SIMPLE OVERVIEW</span><h2>Umrah in Six Steps</h2><p>A brief overview to help you understand the main stages of Umrah.</p></div><div class="steps-grid">${steps.map(s=>`<article class="step"><span>${s[0]}</span><h3>${s[1]}</h3><p>${s[2]}</p></article>`).join("")}</div><p class="notice">This is a general overview, not a substitute for detailed religious guidance. Follow your qualified guide and applicable instructions.</p></div></section>
<section class="section feedback-section" id="feedback"><div class="container feedback-inner"><div><span class="eyebrow">GUEST FEEDBACK</span><h2>Your experience matters.</h2><p>We welcome feedback from guests to help us improve. Reviews will appear here after submission and approval.</p></div><div class="feedback-empty"><span class="quote-mark">“</span><strong>Be the first to share your experience.</strong><span>Guest reviews are not yet available.</span></div></div></section>
<section class="enquiry-section section" id="enquiry"><div class="container enquiry-layout"><div><span class="eyebrow">LET'S PLAN TOGETHER</span><h2>Start your Umrah enquiry</h2><p>Send us your details and our team can guide you about package availability and next steps.</p><div class="contact-points"><span>✦ Bahrain-based assistance</span><span>✦ Air and bus package enquiries</span></div></div><form id="enquiry-form" class="enquiry-form"><label>Your name<input name="name" required placeholder="Enter your full name"></label><label>Phone / WhatsApp<input name="phone" required type="tel" placeholder="Your contact number"></label><label>Package of interest<select name="package"><option value="">Select a package</option>${packages.map(p=>`<option>${p.name}</option>`).join("")}<option>Not sure yet</option></select></label><label>Message<textarea name="message" rows="3" placeholder="Travel dates or questions (optional)"></textarea></label><button class="button button-dark" type="submit">Send enquiry via WhatsApp</button><small>Opens WhatsApp with your enquiry. This preview does not yet save enquiries to Firebase.</small></form></div></section>
<section class="contact-section section" id="contact"><div class="container contact-grid"><div><span class="eyebrow">VISIT OR CONTACT US</span><h2>We're here to help.</h2><p>Al Naseem Group (formerly Al Anfal Group)</p></div><div class="contact-detail"><strong>Office</strong><span>Block 215, Road 1527, Building 1068, Muharraq, Bahrain</span><strong>Call / WhatsApp</strong><a href="https://wa.me/97333224271">+973 3322 4271</a><a href="https://wa.me/97333433533">+973 3343 3533</a><strong>Email</strong><a href="mailto:Alanfal-bh@hotmail.com">Alanfal-bh@hotmail.com</a><strong>CR Number</strong><span>7601540-1</span></div><div class="social-links"><a href="https://www.youtube.com/@alanfal8033" target="_blank" rel="noreferrer">YouTube ↗</a><a href="https://whatsapp.com/channel/0029Vak1FgZC1FuGGaaUXB1A" target="_blank" rel="noreferrer">WhatsApp Channel ↗</a><a href="https://www.tiktok.com/discover/naseem-umrah-package-bahrain" target="_blank" rel="noreferrer">TikTok ↗</a><a href="https://www.google.com/maps/search/?api=1&query=Block+215+Road+1527+Building+1068+Muharraq+Bahrain" target="_blank" rel="noreferrer">View location ↗</a></div></div></section>
</main><footer><div class="container footer-inner"><span>© <span id="year"></span> Al Naseem Group. All rights reserved.</span><span>Umrah Services · Bahrain</span></div></footer>
<div class="setup-banner" id="setup-banner" ${isFirebaseConfigured?"hidden":""}>Development preview · Firebase is not connected yet</div>`;

document.querySelector("#year").textContent = new Date().getFullYear();
const toggle = document.querySelector(".menu-toggle");
toggle.addEventListener("click",()=>{const nav=document.querySelector(".nav-links");const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));});
document.querySelectorAll(".nav-links a").forEach(a=>a.addEventListener("click",()=>{document.querySelector(".nav-links").classList.remove("open");toggle.setAttribute("aria-expanded","false");}));
document.querySelectorAll("[data-package]").forEach(a=>a.addEventListener("click",()=>{document.querySelector('select[name="package"]').value=a.dataset.package;}));
document.querySelector("#enquiry-form").addEventListener("submit",e=>{e.preventDefault();const d=new FormData(e.currentTarget);const msg=["Assalamu Alaikum, I would like to enquire about an Umrah package.",`Name: ${d.get("name")}`,`Phone: ${d.get("phone")}`,`Package: ${d.get("package")||"Not selected"}`,`Message: ${d.get("message")||"—"}`].join("\n");window.open(`https://wa.me/97333224271?text=${encodeURIComponent(msg)}`,"_blank","noopener,noreferrer");});
