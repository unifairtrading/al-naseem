// Keep the public website stylesheet completely separate from the admin portal.
// Loading both global stylesheets on /admin caused conflicting page-wide styles.
if (window.location.pathname.replace(/\/$/, "") === "/admin") {
  import("./admin.js");
} else {
  import("./styles.css");
  import("./main.js");
}
