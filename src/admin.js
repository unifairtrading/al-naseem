import { auth, db, isFirebaseConfigured } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import "./admin.css";

const root = document.querySelector("#app");
root.innerHTML = [
  '<main class="admin-shell"><header class="admin-top"><a href="/">← Back to public website</a><span>AL NASEEM GROUP · CONTROL PANEL</span></header>',
  '<section class="admin-card" id="admin-card"><div class="admin-mark">AN</div><p class="admin-kicker">SECURE BUSINESS ACCESS</p><h1>Admin Portal</h1><p class="admin-intro">Sign in with your authorised Al Naseem administrator account.</p>',
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
    '<div class="dashboard-heading"><div><span class="role-pill">' + (superAdmin ? "SUPER ADMIN" : "STAFF ADMIN") + '</span><h2>Welcome to your workspace</h2><p>' + escapeHtml(user.email || "Authorised administrator") + '</p></div><button class="admin-logout" id="logout-button" type="button">Sign out</button></div>',
    '<div class="dashboard-intro"><strong>Manage your website content</strong><span>Hotel booking options are ready to manage below. Other business modules will be added in the next development stages.</span></div>',
    '<section class="hotel-manager"><div class="manager-heading"><div><span class="admin-kicker">WEBSITE MODULE</span><h3>Hotel booking management</h3><p>Control whether hotel booking appears on the public website and update the hotel details shown to visitors.</p></div><label class="switch-row"><input type="checkbox" id="hotels-active"><span class="switch-ui"></span><span class="switch-label">Show hotel booking</span></label></div>',
    '<div class="manager-status"><span class="status-light"></span><span id="hotel-status-text">Loading hotel settings…</span></div>',
    '<label class="field-label" for="hotels-intro">Hotel section introduction</label><textarea id="hotels-intro" rows="2" placeholder="A short message shown above hotel options"></textarea>',
    '<div class="hotel-manager-grid"><div class="hotel-editor-panel"><h4 id="hotel-form-heading">Add a hotel</h4><form id="hotel-form" class="hotel-form">',
    '<label>Hotel name<input name="hotelName" required maxlength="80" placeholder="Example: Hotel name"></label><label>City / location<input name="location" maxlength="100" placeholder="Makkah, Madinah or other location"></label>',
    '<label>Short description<textarea name="description" rows="3" maxlength="300" placeholder="Describe the hotel or key details"></textarea></label><label>Price note<input name="priceLabel" maxlength="60" placeholder="Example: Ask for current rates"></label>',
    '<label>Hotel image URL <small>Optional. Add a direct image link beginning with https://</small><input name="imageUrl" type="url" placeholder="https://example.com/hotel.jpg"></label>',
    '<label>Booking / information link <small>Optional. Leave blank to use the website enquiry form.</small><input name="bookingUrl" type="url" placeholder="https://example.com/booking"></label>',
    '<div class="hotel-form-actions"><button type="submit" class="save-hotel-button" id="hotel-add-button">Add hotel to list</button><button type="button" class="cancel-edit-button" id="hotel-cancel-edit" hidden>Cancel edit</button></div></form></div>',
    '<div class="hotel-list-panel"><div class="list-heading"><h4>Hotels on your website</h4><span id="hotel-count">0 hotels</span></div><div id="hotel-list"><div class="empty-hotels">Loading hotel list…</div></div></div></div>',
    '<div class="manager-footer"><span>Remember to save after making changes.</span><button type="button" id="save-hotel-settings" class="publish-button">Save hotel settings</button></div><div id="hotel-feedback" class="hotel-feedback" role="status"></div></section>',
    '<section class="coming-modules"><h3>Other website areas</h3><div class="admin-modules"><article><strong>Umrah Packages</strong><span>Package editing and pricing controls — coming next</span></article><article><strong>Enquiries</strong><span>Enquiry inbox and status management — coming next</span></article><article><strong>Guest Feedback</strong><span>Review approval tools — coming next</span></article><article><strong>Website Content</strong><span>Homepage and contact content — coming next</span></article>' + (superAdmin ? '<article><strong>Staff & Permissions</strong><span>Staff accounts and access levels — Super Admin</span></article><article><strong>Technical Settings</strong><span>Technical controls — Super Admin only</span></article>' : '') + '</div></section>'
  ].join("");

  document.querySelector("#logout-button").addEventListener("click", async () => {
    await signOut(auth);
    window.location.reload();
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
}

function updateHotelStatus() {
  const active = document.querySelector("#hotels-active").checked;
  const status = document.querySelector("#hotel-status-text");
  const light = document.querySelector(".status-light");
  status.textContent = active ? "Hotel booking will be visible on the public website after saving." : "Hotel booking is hidden from public visitors after saving.";
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
    const credential = await signInWithEmailAndPassword(auth, values.get("email"), values.get("password"));
    const profile = await getDoc(doc(db, "users", credential.user.uid));
    const role = profile.exists() ? profile.data().role : null;
    if (role !== "super_admin" && role !== "staff_admin") {
      await signOut(auth);
      say("Login succeeded, but this account has not been assigned an admin role. Ask the Super Admin to authorise it.", "warning");
      return;
    }
    showDashboard(credential.user, role);
  } catch (error) {
    const friendly = error.code === "auth/invalid-credential" ? "Email or password is incorrect." :
      error.code === "auth/too-many-requests" ? "Too many attempts. Please wait and try again." :
      "Could not sign in. Please check your connection and Firebase Authentication settings.";
    say(friendly, "error");
  } finally {
    button.disabled = false;
    button.textContent = "Sign in securely";
  }
});

if (auth && db) {
  onAuthStateChanged(auth, async (user) => {
    if (!user) return;
    try {
      const profile = await getDoc(doc(db, "users", user.uid));
      const role = profile.exists() ? profile.data().role : null;
      if (role === "super_admin" || role === "staff_admin") showDashboard(user, role);
      else await signOut(auth);
    } catch {
      say("Could not verify your admin permissions. Please sign in again.", "error");
      await signOut(auth);
    }
  });
}
