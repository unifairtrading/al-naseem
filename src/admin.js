import { auth, db, firebaseConfig, isFirebaseConfigured } from "./firebase.js";
import { initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
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
let managedPackages = [];
let editingPackageIndex = -1;

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
          '<a class="admin-nav-link" href="#package-management"><span class="nav-icon">✧</span><span>Umrah Packages</span><span class="nav-count" id="nav-package-count">0</span></a>',
          '<a class="admin-nav-link" href="#enquiry-management"><span class="nav-icon">▤</span><span>Enquiries</span><span class="nav-count" id="nav-enquiry-count">0</span></a>',
          '<span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">☆</span><span>Guest Feedback</span><small>In development</small></span>',
          '<span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">▧</span><span>Website Content</span><small>In development</small></span>',
          (superAdmin ? '<div class="sidebar-label sidebar-label-spaced">ADMINISTRATION</div><a class="admin-nav-link" href="#staff-management"><span class="nav-icon">♙</span><span>Staff & Permissions</span></a><span class="admin-nav-link nav-disabled" aria-disabled="true"><span class="nav-icon">⚙</span><span>System Settings</span><small>In development</small></span>' : ''),
        '</nav>',
        '<div class="sidebar-bottom"><span class="sidebar-avatar">' + escapeHtml((user.email || "A").charAt(0).toUpperCase()) + '</span><span class="sidebar-user"><strong>' + escapeHtml(user.email || "Administrator") + '</strong><small>' + (superAdmin ? "Super Admin" : "Staff Admin") + '</small></span></div>',
      '</aside>',
      '<main class="admin-main">',
        '<header class="workspace-topbar"><div><span class="topbar-caption">AL NASEEM GROUP / CONTROL CENTRE</span><span class="topbar-secure"><i></i> Secure workspace</span></div><div class="topbar-actions"><a href="/" target="_blank" rel="noopener">View live website <span>↗</span></a><button class="topbar-logout" id="logout-button" type="button">Log out</button></div></header>',
        '<section class="workspace-content workspace-overview" id="admin-overview">',
          '<div class="welcome-row"><div><span class="welcome-eyebrow">BUSINESS CONTROL CENTRE</span><h1>Welcome back.</h1><p>Your Al Naseem website operations, all in one place.</p></div><div class="welcome-date"><span>ACCOUNT ACCESS</span><strong>' + (superAdmin ? "Full control" : "Full business access") + '</strong><small>' + (superAdmin ? "All administrative permissions" : "All business modules · No system security access") + '</small></div></div>',
          '<div class="overview-cards">',
            '<article class="overview-card overview-card-primary"><span class="overview-icon">▦</span><span class="overview-label">HOTEL RECORDS</span><strong id="overview-hotel-count">—</strong><small>Hotel options saved in your website</small></article>',
            '<article class="overview-card"><span class="overview-icon">◉</span><span class="overview-label">HOTEL SECTION</span><strong id="overview-hotel-status">Checking…</strong><small>Public website visibility</small></article>',
            '<article class="overview-card"><span class="overview-icon">♙</span><span class="overview-label">YOUR ACCESS</span><strong>' + (superAdmin ? "Super Admin" : "Staff Admin") + '</strong><small>' + (superAdmin ? "Owner-level control" : "Full access to business operations") + '</small></article>',
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
          '<section class="package-management" id="package-management">',
            '<div class="section-title-row"><div><span class="section-eyebrow">WEBSITE MANAGEMENT</span><h2>Umrah Packages</h2><p>Add, edit and publish the Umrah packages shown to your website visitors.</p></div><span class="section-tag"><i></i> LIVE MODULE</span></div>',
            '<section class="hotel-manager">',
              '<div class="manager-heading"><div><span class="manager-overline">UMRAH PACKAGE LISTINGS</span><h3>Manage your Umrah packages</h3><p>Update package details and choose when they appear on the public website.</p></div><label class="switch-row"><input type="checkbox" id="packages-active"><span class="switch-ui"></span><span>Show Umrah packages</span></label></div>',
              '<div class="manager-status"><span class="status-light" id="package-status-light"></span><span id="package-status-text">Loading package settings…</span></div>',
              '<label class="field-label" for="packages-intro">Section introduction</label><textarea id="packages-intro" rows="2" placeholder="A short introduction shown above your Umrah packages"></textarea>',
              '<div class="hotel-manager-grid"><div class="hotel-editor-panel"><div class="panel-heading"><span class="panel-step">01</span><div><h4 id="package-form-heading">Add an Umrah package</h4><p>Enter the package details visitors should see.</p></div></div><form id="package-form" class="hotel-form">',
                '<label>Website card position<select name="packageSlot"><option value="special">Special / Event package (reserved slot)</option><option value="week1">Upcoming week 1</option><option value="week2">Upcoming week 2</option><option value="week3">Upcoming week 3</option></select><small>Use the special slot for seasonal offers, e.g. Bahrain National Day on 16 December. Update the other three slots weekly.</small></label>',
                '<label>Package name<input name="packageName" required maxlength="100" placeholder="Example: Bahrain by Air"></label>',
                '<label>Travel type<select name="packageType"><option value="AIR">By Air</option><option value="BUS">By Bus</option><option value="OTHER">Other</option></select></label>',
                '<label>Traveller category<input name="audience" maxlength="100" placeholder="Example: Bahraini travellers"></label>',
                '<label>Price<input name="price" maxlength="60" placeholder="Example: 350 BHD"></label>',
                '<label>Price note<input name="priceNote" maxlength="100" placeholder="Example: Per person · indicative price"></label>',
                '<label>Package description<textarea name="description" rows="3" maxlength="500" placeholder="Describe what this package offers"></textarea></label>',
                '<label>Package highlights <small>One highlight per line · up to 8</small><textarea name="highlights" rows="4" placeholder="Flight-based travel option&#10;Hotel assistance&#10;Guidance during the journey"></textarea></label>',
                '<label>Package image URL <small>Optional · Direct image link beginning with https://</small><input name="imageUrl" type="url" placeholder="https://example.com/package.jpg"></label>',
                '<label>Enquiry button text<input name="buttonText" maxlength="60" placeholder="Enquire now"></label>',
                '<div class="hotel-form-actions"><button type="submit" class="save-hotel-button" id="package-add-button">＋ Add package</button><button type="button" class="cancel-edit-button" id="package-cancel-edit" hidden>Cancel</button></div></form></div>',
                '<div class="hotel-list-panel"><div class="list-heading"><div><span class="panel-step">02</span><div><h4>Saved Umrah packages</h4><p>Package details currently held in your website settings.</p></div></div><span id="package-count">0 packages</span></div><div id="package-list"><div class="empty-hotels">Loading your Umrah packages…</div></div></div></div>',
              '<div class="manager-footer"><span>Changes are saved to Firebase when you publish.</span><button type="button" id="save-package-settings" class="publish-button">Save & publish packages <span>→</span></button></div><div id="package-feedback" class="hotel-feedback" role="status"></div>',
            '</section>',
          '</section>',
          '<section class="enquiry-management" id="enquiry-management"><div class="section-title-row"><div><span class="section-eyebrow">CUSTOMER RELATIONSHIPS</span><h2>Customer enquiries</h2><p>Website enquiries saved securely for your team to review and follow up.</p></div><button type="button" class="publish-button" id="refresh-enquiries">Refresh enquiries ↻</button></div><div id="enquiry-list" class="enquiry-list"><div class="empty-hotels">Loading enquiries…</div></div><p id="enquiry-feedback" class="hotel-feedback" role="status"></p></section>',
          (superAdmin ? '<section class="staff-management" id="staff-management"><div class="section-title-row"><div><span class="section-eyebrow">ACCESS CONTROL</span><h2>Staff & permissions</h2><p>Create staff login accounts and manage their access to the business workspace.</p></div><span class="section-tag">SUPER ADMIN ONLY</span></div><div class="staff-grid"><div class="staff-create-panel"><h3>Add a staff member</h3><p>Enter the staff member’s name and email. A password setup link will be sent to their email.</p><form id="staff-form" class="staff-form"><label>Staff name<input name="displayName" required maxlength="80" placeholder="Full name"></label><label>Email address<input name="email" type="email" required maxlength="120" placeholder="staff@example.com"></label><button type="submit" class="publish-button" id="create-staff-button">＋ Create staff account</button></form><p id="staff-feedback" class="hotel-feedback" role="status"></p><p class="staff-note">Every active Staff Admin can use all business modules. Only the Super Admin can manage staff accounts, roles and system security.</p></div><div class="staff-list-panel"><div class="staff-list-heading"><h3>Team accounts</h3><button type="button" class="publish-button" id="refresh-staff">Refresh</button></div><div id="staff-list" class="staff-list"><div class="empty-hotels">Loading staff accounts…</div></div></div></div><div class="staff-audit-panel"><h3>Recent access activity</h3><div id="staff-audit-list" class="staff-audit-list"><div class="empty-hotels">Loading activity…</div></div></div></section>' : ''),
          '<footer class="workspace-footer"><span>AL NASEEM GROUP · ADMIN WORKSPACE</span><span>Secure access · Firebase powered</span></footer>',
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
  loadPackageSettings();
  document.querySelector("#packages-active").addEventListener("change", updatePackageStatus);
  document.querySelector("#package-form").elements.packageSlot.value = "special";
  document.querySelector("#package-form").addEventListener("submit", handlePackageForm);
  document.querySelector("#package-cancel-edit").addEventListener("click", clearPackageForm);
  document.querySelector("#package-list").addEventListener("click", handlePackageListClick);
  document.querySelector("#save-package-settings").addEventListener("click", savePackageSettings);
  loadEnquiries();
  document.querySelector("#refresh-enquiries").addEventListener("click", loadEnquiries);
  if (superAdmin) {
    document.querySelector("#staff-form").addEventListener("submit", createStaffAccount);
    document.querySelector("#refresh-staff").addEventListener("click", loadStaffManagement);
    document.querySelector("#staff-list").addEventListener("click", handleStaffAction);
    loadStaffManagement();
  }
}

let secondaryAuthInstance = null;

function getSecondaryAuth() {
  if (!secondaryAuthInstance) {
    const secondaryApp = initializeApp(firebaseConfig, "al-naseem-staff-creator");
    secondaryAuthInstance = getAuth(secondaryApp);
  }
  return secondaryAuthInstance;
}

function setStaffFeedback(text, error = false) {
  const node = document.querySelector("#staff-feedback");
  if (!node) return;
  node.textContent = text;
  node.dataset.type = error ? "error" : "success";
}

async function writeStaffAudit(action, targetUid, targetEmail, details) {
  await addDoc(collection(db, "auditLogs"), {
    action, targetUid, targetEmail, details,
    actorUid: auth.currentUser.uid,
    actorEmail: auth.currentUser.email || "",
    createdAt: serverTimestamp()
  });
}

async function loadStaffManagement() {
  const list = document.querySelector("#staff-list");
  const auditList = document.querySelector("#staff-audit-list");
  if (!list || currentRole !== "super_admin") return;
  list.innerHTML = '<div class="empty-hotels">Loading staff accounts…</div>';
  try {
    const snapshot = await getDocs(collection(db, "users"));
    const staff = snapshot.docs.map(item => ({ uid: item.id, ...item.data() }))
      .filter(item => item.role === "staff_admin");
    if (!staff.length) {
      list.innerHTML = '<div class="empty-hotels">No staff accounts yet. Add your first staff member using the form.</div>';
    } else {
      list.innerHTML = staff.map(item => '<article class="staff-record"><div class="staff-record-info"><strong>' + escapeHtml(item.displayName || "Staff member") + '</strong><span>' + escapeHtml(item.email || "") + '</span><small>' + (item.active === true ? "Active access" : "Access paused") + '</small></div><button type="button" class="' + (item.active === true ? "staff-deactivate" : "staff-activate") + '" data-staff-action="' + (item.active === true ? "deactivate" : "activate") + '" data-staff-uid="' + escapeHtml(item.uid) + '" data-staff-email="' + escapeHtml(item.email || "") + '">' + (item.active === true ? "Deactivate" : "Activate") + '</button></article>').join("");
    }
  } catch (error) {
    console.error("Staff list load failed:", error);
    list.innerHTML = '<div class="empty-hotels">Staff accounts could not be loaded. Confirm the latest Firestore security rules are deployed.</div>';
  }
  if (auditList) {
    try {
      const logs = await getDocs(query(collection(db, "auditLogs"), orderBy("createdAt", "desc"), limit(10)));
      if (logs.empty) auditList.innerHTML = '<div class="empty-hotels">No staff access changes recorded yet.</div>';
      else auditList.innerHTML = logs.docs.map(item => {
        const entry = item.data();
        const date = entry.createdAt && entry.createdAt.toDate ? entry.createdAt.toDate().toLocaleString() : "Just now";
        return '<article class="staff-audit-record"><strong>' + escapeHtml(entry.action || "Access updated") + '</strong><span>' + escapeHtml(entry.targetEmail || "") + '</span><small>By ' + escapeHtml(entry.actorEmail || "Super Admin") + ' · ' + escapeHtml(date) + '</small></article>';
      }).join("");
    } catch (error) {
      auditList.innerHTML = '<div class="empty-hotels">Activity log is not available until its security rules are published.</div>';
    }
  }
}

async function createStaffAccount(event) {
  event.preventDefault();
  const staffForm = event.currentTarget;
  const submit = document.querySelector("#create-staff-button");
  const values = new FormData(staffForm);
  const displayName = String(values.get("displayName") || "").trim();
  const email = String(values.get("email") || "").trim().toLowerCase();
  if (!displayName || !email || currentRole !== "super_admin") return;
  submit.disabled = true;
  submit.textContent = "Creating secure account…";
  setStaffFeedback("Creating the staff login and sending a password setup email…");
  let createdUid = null;
  try {
    const secondaryAuth = getSecondaryAuth();
    const randomBytes = new Uint8Array(24);
    crypto.getRandomValues(randomBytes);
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    const temporaryPassword = Array.from(randomBytes, value => alphabet[value % alphabet.length]).join("");
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, temporaryPassword);
    createdUid = credential.user.uid;
    await setDoc(doc(db, "users", createdUid), {
      displayName, email, role: "staff_admin", active: true,
      createdAt: serverTimestamp(), createdBy: auth.currentUser.uid
    });
    let resetSent = true;
    try {
      await sendPasswordResetEmail(secondaryAuth, email);
    } catch (mailError) {
      resetSent = false;
      console.error("Staff account created, but password setup email could not be sent:", mailError);
    }
    try {
      await writeStaffAudit("Staff account created", createdUid, email, "Staff Admin access created and activated.");
    } catch (auditError) {
      console.error("Staff account audit write failed:", auditError);
    }
    staffForm.reset();
    setStaffFeedback(resetSent
      ? "Staff account created. Password setup link sent to " + email + "."
      : "Staff account created, but the password email could not be sent. Use Firebase Authentication to send a password reset email.");
    await loadStaffManagement();
  } catch (error) {
    console.error("Could not create staff account:", error);
    const messages = {
      "auth/email-already-in-use": "This email already has a Firebase login. No duplicate account was created.",
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/weak-password": "Firebase rejected the generated password. Please try again.",
      "auth/operation-not-allowed": "Email/Password sign-in must be enabled in Firebase Authentication."
    };
    setStaffFeedback(messages[error.code] || "Could not create the staff account. Error: " + (error.code || "unknown"), true);
    if (createdUid) setStaffFeedback("The login was created but its staff profile could not be saved. Please contact the Super Admin before trying this email again.", true);
  } finally {
    const secondaryAuth = secondaryAuthInstance;
    if (secondaryAuth && secondaryAuth.currentUser) {
      try { await signOut(secondaryAuth); } catch (error) { console.warn("Secondary staff session cleanup:", error); }
    }
    submit.disabled = false;
    submit.textContent = "＋ Create staff account";
  }
}

async function handleStaffAction(event) {
  const actionButton = event.target.closest("[data-staff-action]");
  if (!actionButton || currentRole !== "super_admin") return;
  const action = actionButton.dataset.staffAction;
  const uid = actionButton.dataset.staffUid;
  const email = actionButton.dataset.staffEmail || "";
  if (!uid || !["activate", "deactivate"].includes(action)) return;
  const active = action === "activate";
  const confirmText = active ? "Activate this staff member’s access?" : "Deactivate this staff member? They will no longer be able to use protected admin features.";
  if (!window.confirm(confirmText)) return;
  actionButton.disabled = true;
  try {
    await updateDoc(doc(db, "users", uid), {
      active, updatedAt: serverTimestamp(), updatedBy: auth.currentUser.uid
    });
    try {
      await writeStaffAudit(active ? "Staff access activated" : "Staff access deactivated", uid, email, active ? "Staff Admin access enabled." : "Staff Admin access paused.");
    } catch (auditError) {
      console.error("Staff access audit write failed:", auditError);
    }
    setStaffFeedback(active ? "Staff access activated." : "Staff access deactivated.");
    await loadStaffManagement();
  } catch (error) {
    console.error("Could not update staff access:", error);
    setStaffFeedback("Could not update this staff account. Confirm Firestore security rules are deployed.", true);
    actionButton.disabled = false;
  }
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


function renderPackageList() {
  const list = document.querySelector("#package-list");
  if (!list) return;
  const count = document.querySelector("#package-count");
  const navCount = document.querySelector("#nav-package-count");
  if (count) count.textContent = managedPackages.length + (managedPackages.length === 1 ? " package" : " packages");
  if (navCount) navCount.textContent = String(managedPackages.length);
  if (!managedPackages.length) {
    list.innerHTML = '<div class="empty-hotels">No packages added yet. Add your first Umrah package.</div>';
    return;
  }
  list.innerHTML = managedPackages.map((item,index) =>
    '<article class="managed-package"><div><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(({special:"SPECIAL / EVENT",week1:"UPCOMING WEEK 1",week2:"UPCOMING WEEK 2",week3:"UPCOMING WEEK 3"})[item.slot] || "UNASSIGNED SLOT") + ' · ' + escapeHtml(item.type || "OTHER") + ' · ' + escapeHtml(item.audience || "All travellers") + '</span><small>' + escapeHtml(item.price || "Price on request") + '</small></div><div class="managed-hotel-actions"><button type="button" data-edit-package="' + index + '">Edit</button><button type="button" class="remove-hotel" data-remove-package="' + index + '">Remove</button></div></article>'
  ).join("");
}

function clearPackageForm() {
  const form = document.querySelector("#package-form");
  if (!form) return;
  form.reset();
  form.elements.packageSlot.value = "special";
  editingPackageIndex = -1;
  document.querySelector("#package-add-button").textContent = "＋ Add package";
  document.querySelector("#package-form-heading").textContent = "Add an Umrah package";
  document.querySelector("#package-cancel-edit").hidden = true;
}

function loadPackageIntoForm(index) {
  const item = managedPackages[index];
  if (!item) return;
  const form = document.querySelector("#package-form");
  form.elements.packageSlot.value = item.slot || "week1";
  form.elements.packageName.value = item.name || "";
  form.elements.packageType.value = item.type || "AIR";
  form.elements.audience.value = item.audience || "";
  form.elements.price.value = item.price || "";
  form.elements.priceNote.value = item.priceNote || "";
  form.elements.description.value = item.description || "";
  form.elements.highlights.value = Array.isArray(item.highlights) ? item.highlights.join("\n") : "";
  form.elements.imageUrl.value = item.imageUrl || "";
  form.elements.buttonText.value = item.buttonText || "Enquire now";
  editingPackageIndex = index;
  document.querySelector("#package-add-button").textContent = "Save package changes";
  document.querySelector("#package-form-heading").textContent = "Edit Umrah package";
  document.querySelector("#package-cancel-edit").hidden = false;
  form.scrollIntoView({behavior:"smooth",block:"center"});
}

async function loadPackageSettings() {
  try {
    const snapshot = await getDoc(doc(db,"siteModules","umrahPackages"));
    const data = snapshot.exists() ? snapshot.data() : {};
    managedPackages = Array.isArray(data.packages) ? data.packages.map((item,index)=>({...item,slot:item.slot || (/national day|special|event/i.test(item.name||"")?"special":("week"+Math.min(index+1,3)))})).slice(0,4) : [
      {name:"Bahraini by Air",type:"AIR",audience:"Bahraini travellers",price:"350 BHD",priceNote:"Indicative price · per person",description:"Air travel Umrah package for guests who prefer to fly.",highlights:["Flight-based travel option","Convenient journey planning","Team assistance for enquiries"],buttonText:"Enquire about this package"},
      {name:"Bahraini by Bus",type:"BUS",audience:"Bahraini travellers",price:"70 BHD",priceNote:"Indicative price · per person",description:"A road travel option for guests travelling by coach from Bahrain.",highlights:["Bus journey option","Package for Bahraini travellers","Assistance with travel enquiries"],buttonText:"Enquire about this package"},
      {name:"Non-Bahraini by Bus",type:"BUS",audience:"Non-Bahraini travellers",price:"120 BHD",priceNote:"Indicative price · per person",description:"A bus travel option for eligible non-Bahraini travellers.",highlights:["Land travel Umrah package","For eligible non-Bahraini travellers","Team assistance for enquiries"],buttonText:"Enquire about this package"}
    ];
    document.querySelector("#packages-active").checked = data.active === true;
    document.querySelector("#packages-intro").value = data.intro || "Explore the available travel options below. Select a package to send your enquiry directly to our team.";
    updatePackageStatus();
    renderPackageList();
  } catch(error) {
    console.error("Could not load Umrah packages:",error);
    setPackageFeedback("Package settings could not be loaded. Check that the latest Firestore rules are deployed.",true);
  }
}

function setPackageFeedback(text,error=false) {
  const node=document.querySelector("#package-feedback");
  if (!node) return;
  node.textContent=text;
  node.dataset.type=error?"error":"success";
}

function updatePackageStatus() {
  const active=document.querySelector("#packages-active").checked;
  const status=document.querySelector("#package-status-text");
  const light=document.querySelector("#package-status-light");
  if(status) status.textContent=active?"Managed packages will be shown on the public website after saving.":"Managed packages are currently disabled; the existing public package information will remain visible.";
  if(light) light.classList.toggle("is-active",active);
}

function handlePackageForm(event) {
  event.preventDefault();
  const form=event.currentTarget;
  const values=new FormData(form);
  const imageUrl=String(values.get("imageUrl")||"").trim();
  if(imageUrl && !(imageUrl.startsWith("https://") || imageUrl.startsWith("http://"))) {
    setPackageFeedback("Please use a valid https:// or http:// image link.",true);
    return;
  }
  const item={
    slot:String(values.get("packageSlot")||"week1"),
    name:String(values.get("packageName")||"").trim(),
    type:String(values.get("packageType")||"OTHER"),
    audience:String(values.get("audience")||"").trim(),
    price:String(values.get("price")||"").trim(),
    priceNote:String(values.get("priceNote")||"").trim(),
    description:String(values.get("description")||"").trim(),
    highlights:String(values.get("highlights")||"").split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,8),
    imageUrl,
    buttonText:String(values.get("buttonText")||"Enquire now").trim() || "Enquire now"
  };
  if(!item.name) return;
  const occupied=managedPackages.findIndex((entry,index)=>entry.slot===item.slot && index!==editingPackageIndex);
  if(occupied>=0) { setPackageFeedback("This website card is already occupied. Edit that package or choose another slot.",true); return; }
  if(editingPackageIndex>=0) managedPackages[editingPackageIndex]=item;
  else {
    if(managedPackages.length>=4) { setPackageFeedback("All four package cards are occupied. Edit or remove an existing package first.",true); return; }
    managedPackages.push(item);
  }
  renderPackageList();
  clearPackageForm();
  setPackageFeedback("Package added to the draft list. Select Save & publish packages to update the website.");
}

function handlePackageListClick(event) {
  const edit=event.target.closest("[data-edit-package]");
  const remove=event.target.closest("[data-remove-package]");
  if(edit) loadPackageIntoForm(Number(edit.dataset.editPackage));
  if(remove) {
    const index=Number(remove.dataset.removePackage);
    if(Number.isInteger(index)&&index>=0&&index<managedPackages.length) {
      managedPackages.splice(index,1);
      if(editingPackageIndex===index) clearPackageForm();
      renderPackageList();
      setPackageFeedback("Package removed from the draft list. Save & publish to apply the change.");
    }
  }
}

async function savePackageSettings() {
  const button=document.querySelector("#save-package-settings");
  button.disabled=true;
  button.textContent="Publishing packages…";
  setPackageFeedback("");
  try {
    const active=document.querySelector("#packages-active").checked;
    const intro=document.querySelector("#packages-intro").value.trim();
    await setDoc(doc(db,"siteModules","umrahPackages"),{
      active,intro,packages:managedPackages,updatedAt:serverTimestamp(),updatedBy:auth.currentUser.uid
    },{merge:true});
    try {
      await writeBusinessAudit("Umrah packages published","umrahPackages",managedPackages.length+" package records saved; public visibility "+(active?"enabled":"disabled")+".");
    } catch(auditError) {
      console.error("Umrah package audit write failed:",auditError);
      setPackageFeedback("Packages saved, but the activity log could not be recorded. Please check the latest Firestore rules.",true);
      return;
    }
    setPackageFeedback(active?"Packages saved and published to the public website.":"Package settings saved. Managed packages are disabled; existing public information remains visible.");
  } catch(error) {
    console.error("Could not publish Umrah packages:",error);
    setPackageFeedback("Could not save packages. Confirm the latest Firestore rules are deployed and try again.",true);
  } finally {
    button.disabled=false;
    button.textContent="Save & publish packages";
  }
}

async function writeBusinessAudit(action,moduleId,details) {
  await addDoc(collection(db,"auditLogs"),{
    action,moduleId,targetUid:"",targetEmail:"",details,
    actorUid:auth.currentUser.uid,actorEmail:auth.currentUser.email||"",createdAt:serverTimestamp()
  });
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

    const profileData = profile.exists() ? profile.data() : {};
    const role = profileData.role || null;
    if (role !== "super_admin" && role !== "staff_admin") {
      await signOut(auth);
      say("Login succeeded, but no valid admin role was found for this account. Ask the Super Admin to verify your access.", "warning");
      return;
    }
    if (role === "staff_admin" && profileData.active !== true) {
      await signOut(auth);
      say("This staff account is currently inactive. Please contact the Al Naseem Super Admin.", "warning");
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
