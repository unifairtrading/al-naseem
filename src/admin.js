import { auth, db, isFirebaseConfigured } from "./firebase.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import "./admin.css";

const root = document.querySelector("#app");
root.innerHTML = `
  <main class="admin-shell">
    <header class="admin-top"><a href="/">← Public website</a><span>AL NASEEM GROUP · ADMIN PORTAL</span></header>
    <section class="admin-card" id="admin-card">
      <div class="admin-mark">AN</div>
      <p class="admin-kicker">SECURE ACCESS</p>
      <h1>Admin Portal</h1>
      <p class="admin-intro">Sign in with your authorised Al Naseem admin account.</p>
      <div id="admin-message" class="admin-message" role="status"></div>
      <form id="login-form" class="admin-form">
        <label>Email address<input name="email" type="email" autocomplete="username" required placeholder="admin@example.com"></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required placeholder="Enter your password"></label>
        <button type="submit" id="login-button">Sign in securely</button>
      </form>
      <div id="admin-dashboard" hidden></div>
      <p class="admin-foot">Access is controlled by Firebase Authentication and your assigned admin role.</p>
    </section>
  </main>`;

const form = document.querySelector("#login-form");
const message = document.querySelector("#admin-message");
const button = document.querySelector("#login-button");
const dashboard = document.querySelector("#admin-dashboard");
const say = (text, type = "info") => { message.textContent = text; message.dataset.type = type; };

function showDashboard(user, role) {
  form.hidden = true;
  message.textContent = "";
  dashboard.hidden = false;
  const isSuper = role === "super_admin";
  dashboard.innerHTML = `
    <div class="admin-welcome"><span class="role-pill">${isSuper ? "SUPER ADMIN" : "STAFF ADMIN"}</span><h2>Welcome</h2><p>${user.email || "Authorised administrator"}</p></div>
    <div class="admin-modules">
      <article><strong>Umrah Packages</strong><span>Manage package details and pricing</span></article>
      <article><strong>Enquiries</strong><span>Review and update guest enquiries</span></article>
      <article><strong>Guest Feedback</strong><span>Review and approve submitted feedback</span></article>
      <article><strong>Website Content</strong><span>${isSuper ? "Manage website content and settings" : "Manage approved business content"}</span></article>
      ${isSuper ? '<article><strong>Staff & Permissions</strong><span>Manage staff accounts and access levels</span></article><article><strong>Technical Settings</strong><span>Reserved for Super Admin</span></article>' : ""}
    </div>
    <p class="admin-note">Your account is authenticated. Management screens and database actions will be enabled in the next development stage.</p>
    <button class="admin-logout" id="logout-button" type="button">Sign out</button>`;
  document.querySelector("#logout-button").addEventListener("click", async () => {
    await signOut(auth);
    window.location.reload();
  });
}

if (!isFirebaseConfigured || !auth || !db) {
  say("Firebase configuration is not connected yet. The admin portal is ready, but login will work after the website is connected to your Firebase Web App configuration.", "warning");
  form.querySelector("button").disabled = true;
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
      say("Login succeeded, but this account has not been assigned an admin role yet. Ask the Super Admin to authorise it.", "warning");
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
      say("Could not verify your admin permissions. Please try signing in again.", "error");
      await signOut(auth);
    }
  });
}
