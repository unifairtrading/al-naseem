import { auth, db, isFirebaseConfigured } from "./firebase.js";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import "./admin.css";

const root = document.querySelector("#app");
root.innerHTML = [
  '<main class="admin-shell"><header class="admin-top"><a href="/">← Back to public website</a><span>AL NASEEM GROUP · CONTROL PANEL</span></header>',
  '<section class="admin-card" id="admin-card"><div class="admin-mark"><img class="admin-logo-image" src="/logo2.png" alt="Al Naseem Group logo"></div><p class="admin-kicker">SECURE BUSINESS ACCESS</p><h1>Admin Portal</h1><p class="admin-intro">Sign in with your authorised Al Naseem administrator account.</p>',
  '<div id="admin-message" class="admin-message" role="status"></div>',
  '<form id="login-form" class="admin-form"><label>Email address<input name="email" type="email" autocomplete="username" required placeholder="Enter admin email"></label><label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Enter password"></label><button type="submit" id="login-button">Sign in securely</button></form>',
  '<div id="admin-dashboard" hidden></div><p class="admin-foot">Your dashboard access depends on the role assigned to your Firebase account.</p></section></main>'
].join("");

const form = document.querySelector("#login-form");
const message = document.querySelector("#admin-message");
const button = document.querySelector("#login-button");
const dashboard = document.querySelector("#admin-dashboard");
const card = document.querySelector("#admin-card");
const say = (text, type) => { message.textContent = text; message.dataset.type = type || "info"; };
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[char]));

let currentRole = null;
let hotels = [];
let editingIndex = -1;

function renderHotelList() {
  const list = document.querySelector("#hotel-list");
  if (!list) return;
  const count = document.querySelector("#hotel-count");
  const navCount = document.querySelector("#nav-hotel-count");
  const overviewCount = document.querySelector("#overview-hotel-count");
  if (count) count.textContent = hotels.length + (hotels.length === 1 ? " hotel" : " hotels");
  if (navCount) navCount.textContent = hotels.length;
  if (overviewCount) overviewCount.textContent = hotels.length;
  if (!hotels.length) {
    list.innerHTML = '<div class="empty-hotels">No hotel details added yet. Add your first hotel using the form.</div>';
    return;
  }
  list.innerHTML = hotels.map((hotel, index) =>
    '<article class="managed-hotel"><div><strong>' + escapeHtml(hotel.name) + '</strong><span>' + escapeHtml(hotel.location || "Location not added") + '</span><small>' + escapeHtml(hotel.priceLabel || "Rate on request") + '</small></div><div class="managed-hotel-actions"><button type="button" data-edit-hotel="' + index + '">Edit</button><button type="button" class="remove-hotel" data-remove-hotel="' + index + '">Remove</button></div></article>'
  ).join("");
}

function clearHotelForm() {
  const hotelForm = document.querySelector("#hotel-form");
  if (!hotelForm) return;
  hotelForm.reset();
  editingIndex = -1;
  document.querySelector("#hotel-add-button").textContent = "Add hotel to list";
  document.querySelector("#hotel-cancel-edit").hidden = true;
}

function loadHotelIntoForm(index) {
  const hotel = hotels[index];
  if (!hotel) return;
  const hotelForm = document.querySelector("#hotel-form");
  hotelForm.elements.hotelName.value = hotel.name || "";
  hotelForm.elements.location.value = hotel.location || "";
  hotelForm.elements.description.value = hotel.description || "";
  hotelForm.elements.priceLabel.value = hotel.priceLabel || "";
  hotelForm.elements.imageUrl.value = hotel.imageUrl || "";
  hotelForm.elements.bookingUrl.value = hotel.bookingUrl || "";
  editingIndex = index;
  document.querySelector("#hotel-add-button").textContent = "Save hotel changes";
  document.querySelector("#hotel-cancel-edit").hidden = false;
  hotelForm.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function loadHotelSettings() {
  try {
    const snapshot = await getDoc(doc(db, "siteModules", "hotels"));
    const data = snapshot.exists() ? snapshot.data() : {};
    hotels = Array.isArray(data.hotels) ? data.hotels : [];
    document.querySelector("#hotels-active").checked = data.active === true;
    const overviewStatus = document.querySelector("#overview-hotel-status");
    if (overviewStatus) overviewStatus.textContent = data.active === true ? "Visible" : "Hidden";
    document.querySelector("#hotels-intro").value = data.intro || "Explore hotel options shared by our team. Contact us to check availability, rates and booking terms.";
    renderHotelList();
  } catch (error) {
    say("Hotel settings could not be loaded. Please check that the latest Firestore rules are active, then refresh this page.", "error");
  }
}

function showDashboard(user, role) {
  currentRole = role;
  form.hidden = true;
  message.textContent = "";
  dashboard.hidden = false;
  card.classList.add("dashboard-mode");
  const superAdmin = role === "super_admin";
  dashboard.innerHTML = [
    '<div class="admin-workspace">',
      '<aside class="admin-sidebar">',
        '<a class="sidebar-brand" href="/" aria-label="Al Naseem public website"><span class="brand-emblem"><img class="sidebar-logo-image" src="/logo2.png" alt="Al Naseem Group logo"></span><span><strong>AL NASEEM</strong><small>GROUP · ADMIN</small></span></a>',
        '<div class="sidebar-label">WORKSPACE</div>',
        '<nav class="admin-nav" aria-label="Admin navigation">',
          '<a class="admin-nav-link is-current" href="#admin-overview"><span class="nav-icon">⌂</span><span>Overview</span></a>',
          '<a class="admin-nav-link" href="#hotel-management"><span class="nav-icon">▦</span><span>Hotels</span><span class="nav-count" id="nav-hotel-count">0</span></a>',
          '<span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">✧</span><span>Umrah Packages</span><small>In development</small></span>',
          '<a class="admin-nav-link" href="#enquiry-management"><span class="nav-icon">▤</span><span>Enquiries</span><span class="nav-count" id="nav-enquiry-count">0</span></a>',
          '<span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">☆</span><span>Guest Feedback</span><small>In development</small></span>',
          '<span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">▧</span><span>Website Content</span><small>In development</small></span>',
          (superAdmin ? '<div class="sidebar-label sidebar-label-spaced">ADMINISTRATION</div><span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">♙</span><span>Staff & Permissions</span><small>Secure setup pending</small></span><span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">⚙</span><span>System Settings</span><small>In development</small></span>' : ''),
        '</nav>',
        '<div class="sidebar-bottom"><span class="sidebar-avatar">' + escapeHtml((user.email || "A").charAt(0).toUpperCase()) + '</span><span class="sidebar-user"><strong>' + escapeHtml(user.email || "Administrator") + '</strong><small>' + (superAdmin ? "Super Admin" : "Staff Admin") + '</small></span></div>',
      '</aside>',
      '<main class="admin-main">',
        '<header class="workspace-topbar"><div><span class="topbar-caption">AL NASEEM GROUP / CONTROL CENTRE</span><span class="topbar-secure"><i></i> Secure workspace</span></div><div class="topbar-actions"><a href="/" target="_blank" rel="noopener">View live website <span>↗</span></a><button class="topbar-logout" id="logout-button" type="button">Log out</button></div></header>',
        '<section class="workspace-content workspace-overview" id="admin-overview">',
          '<div class="welcome-row"><div><span class="welcome-eyebrow">BUSINESS CONTROL CENTRE</span><h1>Welcome back.</h1><p>Your Al Naseem website operations, all in one place.</p></div><div class="welcome-date"><span>ACCOUNT ACCESS</span><strong>' + (superAdmin ? "Full control" : "Staff access") + '</strong><small>' + (superAdmin ? "All administrative permissions" : "Assigned business permissions") + '</small></div></div>',
          '<div class="overview-cards">',
            '<article class="overview-card overview-card-primary"><span class="overview-icon">▦</span><span class="overview-label">HOTEL RECORDS</span><strong id="overview-hotel-count">—</strong><small>Hotel options saved in your website</small></article>',
            '<article class="overview-card"><span class="overview-icon">◉</span><span class="overview-label">HOTEL SECTION</span><strong id="overview-hotel-status">Checking…</strong><small>Public website visibility</small></article>',
            '<article class="overview-card"><span class="overview-icon">♙</span><span class="overview-label">YOUR ACCESS</span><strong>' + (superAdmin ? "Super Admin" : "Staff Admin") + '</strong><small>' + (superAdmin ? "Owner-level control" : "Limited staff access") + '</small></article>',
          '</div>',
          '<div class="section-title-row" id="hotel-management"><div><span class="section-eyebrow">WEBSITE MANAGEMENT</span><h2>Hotel management</h2><p>Add, update and publish the hotel options shown to your visitors.</p></div><span class="section-tag"><i></i> LIVE MODULE</span></div>',
          '<section class="hotel-manager">',
            '<div class="manager-heading"><div><span class="manager-overline">HOTEL BOOKING</span><h3>Manage your hotel listings</h3><p>Control the hotel section, edit hotel details and decide when the section is visible on your public website.</p></div><label class="switch-row"><input type="checkbox" id="hotels-active"><span class="switch-ui"></span><span class="switch-label">Show hotel booking</span></label></div>',
            '<div class="manager-status"><span class="status-light"></span><span id="hotel-status-text">Loading hotel settings…</span></div>',
            '<label class="field-label" for="hotels-intro">Section introduction</label><textarea id="hotels-intro" rows="2" placeholder="A short message shown above hotel options"></textarea>',
            '<div class="hotel-manager-grid"><div class="hotel-editor-panel"><div class="panel-heading"><span class="panel-step">01</span><div><h4 id="hotel-form-heading">Add a hotel</h4><p>Enter the details visitors should see.</p></div></div><form id="hotel-form" class="hotel-form">',
              '<label>Hotel name<input name="hotelName" required maxlength="80" placeholder="Example: Hotel name"></label><label>City / location<input name="location" maxlength="100" placeholder="Makkah, Madinah or other location"></label>',
              '<label>Short description<textarea name="description" rows="3" maxlength="300" placeholder="Describe the hotel or key details"></textarea></label><label>Price note<input name="priceLabel" maxlength="60" placeholder="Example: Ask for current rates"></label>',
              '<label>Hotel image URL <small>Optional · Direct image link beginning with https://</small><input name="imageUrl" type="url" placeholder="https://example.com/hotel.jpg"></label>',
              '<label>Booking / information link <small>Optional · Leave blank to use the website enquiry form.</small><input name="bookingUrl" type="url" placeholder="https://example.com/booking"></label>',
              '<div class="hotel-form-actions"><button type="submit" class="save-hotel-button" id="hotel-add-button">＋ Add hotel</button><button type="button" class="cancel-edit-button" id="hotel-cancel-edit" hidden>Cancel</button></div></form></div>',
              '<div class="hotel-list-panel"><div class="list-heading"><div><span class="panel-step">02</span><div><h4>Published hotel options</h4><p>Hotels currently saved in your website settings.</p></div></div><span id="hotel-count">0 hotels</span></div><div id="hotel-list"><div class="empty-hotels">Loading your hotel list…</div></div></div></div>',
            '<div class="manager-footer"><span>Changes are saved to Firebase when you publish.</span><button type="button" id="save-hotel-settings" class="publish-button">Save & publish changes <span>→</span></button></div><div id="hotel-feedback" class="hotel-feedback" role="status"></div>',
          '</section>',
          '<section class="enquiry-management" id="enquiry-management"><div class="section-title-row"><div><span class="section-eyebrow">CUSTOMER RELATIONSHIPS</span><h2>Customer enquiries</h2><p>Website enquiries saved securely for your team to review and follow up.</p></div><button type="button" class="publish-button" id="refresh-enquiries">Refresh enquiries ↻</button></div><div id="enquiry-list" class="enquiry-list"><div class="empty-hotels">Loading enquiries…</div></div><p id="enquiry-feedback" class="hotel-feedback" role="status"></p></section><footer class="workspace-footer"><span>AL NASEEM GROUP · ADMIN WORKSPACE</span><span>Secure access · Firebase powered</span></footer>',
        '</section>',
      '</main>',
    '</div>'
  ].join("");

  document.querySelector("#logout-button").addEventListener("click", async () => {
    await signOut(auth);
    window.location.reload();
  });

  document.querySelectorAll(".admin-nav-link").forEach(link => {
    link.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav-link").forEach(item => item.classList.remove("is-current"));
      link.classList.add("is-current");
    });
  });
  document.querySelector("#hotels-active").addEventListener("change", updateHotelStatus);
  document.querySelector("#hotel-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const hotelForm = event.currentTarget;
    const values = new FormData(hotelForm);
    const hotel = {
      name: String(values.get("hotelName") || "").trim(),
      location: String(values.get("location") || "").trim(),
      description: String(values.get("description") || "").trim(),
      priceLabel: String(values.get("priceLabel") || "").trim(),
      imageUrl: String(values.get("imageUrl") || "").trim(),
      bookingUrl: String(values.get("bookingUrl") || "").trim()
    };
    if (!hotel.name) return;
    if (hotel.imageUrl && !/^https?:\/\//i.test(hotel.imageUrl)) {
      setHotelFeedback("Please use a valid https:// or http:// image link.", true);
      return;
    }
    if (hotel.bookingUrl && !/^https?:\/\//i.test(hotel.bookingUrl)) {
      setHotelFeedback("Please use a valid https:// or http:// booking link.", true);
      return;
    }
    if (editingIndex >= 0) hotels[editingIndex] = hotel;
    else hotels.push(hotel);
    renderHotelList();
    clearHotelForm();
    setHotelFeedback("Hotel details added to the draft list. Now save hotel settings to publish them.", false);
  });

  document.querySelector("#hotel-cancel-edit").addEventListener("click", clearHotelForm);
  document.querySelector("#hotel-list").addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-hotel]");
    const removeButton = event.target.closest("[data-remove-hotel]");
    if (editButton) loadHotelIntoForm(Number(editButton.dataset.editHotel));
    if (removeButton) {
      const index = Number(removeButton.dataset.removeHotel);
      if (Number.isInteger(index) && index >= 0 && index < hotels.length) {
        hotels.splice(index, 1);
        if (editingIndex === index) clearHotelForm();
        renderHotelList();
        setHotelFeedback("Hotel removed from the draft list. Save settings to publish the change.", false);
      }
    }
  });
  document.querySelector("#save-hotel-settings").addEventListener("click", saveHotelSettings);
  loadHotelSettings();
  loadEnquiries();
  document.querySelector("#refresh-enquiries").addEventListener("click", loadEnquiries);
}

async function loadEnquiries() {
  const list = document.querySelector("#enquiry-list");
  const feedback = document.querySelector("#enquiry-feedback");
  if (!list) return;
  list.innerHTML = '<div class="empty-hotels">Loading customer enquiries…</div>';
  try {
    const snapshot = await getDocs(query(collection(db, "enquiries"), orderBy("createdAt", "desc")));
    const items = snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
    const count = document.querySelector("#nav-enquiry-count");
    if (count) count.textContent = String(items.filter(item => item.status === "new").length);
    if (!items.length) {
      list.innerHTML = '<div class="empty-hotels">No enquiries received yet. New website enquiries will appear here.</div>';
      return;
    }
    list.innerHTML = items.map(item => {
      const date = item.createdAt && item.createdAt.toDate ? item.createdAt.toDate().toLocaleString() : "Just received";
      return '<article class="enquiry-record"><div class="enquiry-record-main"><div class="enquiry-record-top"><strong>' + escapeHtml(item.name) + '</strong><span class="enquiry-status status-' + escapeHtml(item.status || "new") + '">' + escapeHtml(item.status || "new") + '</span></div><p>' + escapeHtml(item.interest || "General enquiry") + ' · ' + escapeHtml(item.phone) + '</p><small>' + escapeHtml(date) + '</small><div class="enquiry-message">' + escapeHtml(item.message || "No additional message") + '</div></div><div class="enquiry-record-actions"><a href="https://wa.me/' + escapeHtml(String(item.phone || "").replace(/[^0-9]/g, "")) + '" target="_blank" rel="noopener">WhatsApp ↗</a><select aria-label="Update enquiry status" data-enquiry-status="' + item.id + '"><option value="new" ' + (item.status === "new" ? "selected" : "") + '>New</option><option value="contacted" ' + (item.status === "contacted" ? "selected" : "") + '>Contacted</option><option value="closed" ' + (item.status === "closed" ? "selected" : "") + '>Closed</option></select></div></article>';
    }).join("");
    list.querySelectorAll("[data-enquiry-status]").forEach(select => select.addEventListener("change", async () => {
      select.disabled = true;
      try {
        await updateDoc(doc(db, "enquiries", select.dataset.enquiryStatus), { status: select.value, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid });
        if (feedback) feedback.textContent = "Enquiry status updated.";
        const count = document.querySelector("#nav-enquiry-count");
        if (count) count.textContent = String([...list.querySelectorAll("[data-enquiry-status]")].filter(node => node.value === "new").length);
      } catch (error) {
        if (feedback) feedback.textContent = "Could not update this enquiry. Check your permissions and try again.";
        select.value = "new";
      } finally { select.disabled = false; }
    }));
  } catch (error) {
    console.error("Could not load enquiries:", error);
    list.innerHTML = '<div class="empty-hotels">Enquiries could not be loaded. Confirm the latest Firestore security rules are deployed.</div>';
  }
}

function updateHotelStatus() {
  const active = document.querySelector("#hotels-active").checked;
  const status = document.querySelector("#hotel-status-text");
  const light = document.querySelector(".status-light");
  status.textContent = active ? "Hotel booking will be visible on the public website after saving." : "Hotel booking is hidden from public visitors after saving.";
  const overviewStatus = document.querySelector("#overview-hotel-status");
  if (overviewStatus) overviewStatus.textContent = active ? "Visible" : "Hidden";
  light.classList.toggle("is-active", active);
}

function setHotelFeedback(text, error) {
  const feedback = document.querySelector("#hotel-feedback");
  if (!feedback) return;
  feedback.textContent = text;
  feedback.dataset.type = error ? "error" : "success";
}

async function saveHotelSettings() {
  const saveButton = document.querySelector("#save-hotel-settings");
  saveButton.disabled = true;
  saveButton.textContent = "Saving settings…";
  setHotelFeedback("", false);
  try {
    const active = document.querySelector("#hotels-active").checked;
    const intro = document.querySelector("#hotels-intro").value.trim();
    await setDoc(doc(db, "siteModules", "hotels"), {
      active: active,
      intro: intro,
      hotels: hotels,
      updatedAt: serverTimestamp(),
      updatedBy: auth.currentUser ? auth.currentUser.uid : null
    }, { merge: true });
    setHotelFeedback(active ? "Saved successfully. Hotel booking is enabled on the public website." : "Saved successfully. Hotel booking is now hidden from the public website.", false);
    updateHotelStatus();
  } catch (error) {
    setHotelFeedback("Could not save settings. Please confirm the latest Firestore rules are deployed and try again.", true);
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save hotel settings";
  }
}

if (!isFirebaseConfigured || !auth || !db) {
  say("Firebase configuration is not connected. Admin login is unavailable until Firebase is configured.", "warning");
  button.disabled = true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!auth || !db) return;
  button.disabled = true;
  button.textContent = "Checking account…";
  say("Verifying your login details…");
  const values = new FormData(form);

  try {
    // Keep Authentication and Firestore checks separate so the real failure is clear.
    const credential = await signInWithEmailAndPassword(
      auth,
      String(values.get("email") || "").trim(),
      String(values.get("password") || "")
    );

    let profile;
    try {
      profile = await getDoc(doc(db, "users", credential.user.uid));
    } catch (profileError) {
      console.error("Firebase sign-in succeeded, but the admin role document could not be read:", profileError);
      await signOut(auth);
      const code = profileError.code || "unknown";
      const detail = code === "permission-denied"
        ? "Firestore rules are blocking access to your own admin profile. Please check that the latest Firestore rules are published."
        : "Firebase Authentication accepted your login, but Firestore could not verify your admin profile.";
      say(detail + " (Error: " + code + ")", "error");
      return;
    }

    const role = profile.exists() ? profile.data().role : null;
    if (role !== "super_admin" && role !== "staff_admin") {
      await signOut(auth);
      say("Login succeeded, but no valid admin role was found for this account. Check that users/" + credential.user.uid + " has role = super_admin.", "warning");
      return;
    }
    showDashboard(credential.user, role);
  } catch (error) {
    console.error("Firebase Authentication sign-in failed:", error);
    const code = error.code || "unknown";
    const messages = {
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      "auth/network-request-failed": "The browser could not reach Firebase. Check your internet connection or browser network blocking.",
      "auth/unauthorized-domain": "This website address is not authorised in Firebase. Add al-naseem-d40c8.web.app under Authentication → Settings → Authorized domains.",
      "auth/operation-not-allowed": "Email/Password sign-in is disabled. Enable it in Firebase Authentication → Sign-in method.",
      "auth/invalid-api-key": "Firebase API key is invalid or restricted. Check the Web App configuration and API key restrictions.",
      "auth/configuration-not-found": "Firebase Authentication is not configured for this project. Open Firebase Authentication and complete its setup."
    };
    say((messages[code] || "Firebase returned an unexpected login error. Check the exact error code below.") + " (Error: " + code + ")", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Sign in securely";
  }
});

// Require an explicit sign-in every time the admin portal is opened.
// Firebase otherwise restores the previous browser session and opens the dashboard silently.
if (auth) {
  signOut(auth).catch((error) => console.error("Could not clear the previous admin session:", error));
}
