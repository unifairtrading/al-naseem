import "./styles.css";
if (window.location.pathname.replace(/\/$/, "") === "/admin") {
  import("./admin.js");
} else {
  import("./main.js");
}
