import {
  collection, doc, getDoc, getDocs, query, orderBy, setDoc, serverTimestamp,
  writeBatch
} from "firebase/firestore";

const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, ch => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[ch]));

const monthKey = date => date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
const monthTitle = key => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
};
const toDate = value => value && typeof value.toDate === "function" ? value.toDate() : null;
const eligibleMonth = key => {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month + 1, 0) <= new Date();
};

export function mountArchive(db, auth) {
  const root = document.querySelector("#archive-management");
  if (!root) return;

  const select = root.querySelector("#archive-month");
  const downloadButton = root.querySelector("#download-archive");
  const savedCheck = root.querySelector("#archive-saved-check");
  const confirmButton = root.querySelector("#confirm-archive");
  const confirmPanel = root.querySelector("#archive-confirmation");
  const feedback = root.querySelector("#archive-feedback");
  let cached = { enquiries: [], auditLogs: [] };
  let pending = null;

  const say = message => { feedback.textContent = message; };

  async function refresh() {
    select.innerHTML = '<option value="">Loading…</option>';
    downloadButton.disabled = true;
    try {
      const [enquiries, logs] = await Promise.all([
        getDocs(query(collection(db, "enquiries"), orderBy("createdAt", "asc"))),
        getDocs(query(collection(db, "auditLogs"), orderBy("createdAt", "asc")))
      ]);
      cached.enquiries = enquiries.docs.map(s => ({ id: s.id, ...s.data() }));
      cached.auditLogs = logs.docs.map(s => ({ id: s.id, ...s.data() }));
      const keys = new Set();
      [...cached.enquiries, ...cached.auditLogs].forEach(item => {
        const date = toDate(item.createdAt);
        if (date && eligibleMonth(monthKey(date))) keys.add(monthKey(date));
      });
      const options = [...keys].sort().reverse();
      select.innerHTML = options.length
        ? options.map(key => '<option value="' + key + '">' + escapeHtml(monthTitle(key)) + '</option>').join("")
        : '<option value="">No eligible months yet</option>';
      downloadButton.disabled = !options.length;
      say(options.length
        ? "Choose a month, download the PDF, check it, save it on the company PC, then confirm."
        : "No month has completed the one-calendar-month retention period. Nothing has been deleted.");
    } catch (error) {
      console.error("Archive listing failed:", error);
      select.innerHTML = '<option value="">Could not load archive months</option>';
      say("Could not load archive records. Nothing has been deleted.");
    }
  }

  function download() {
    const key = select.value;
    if (!key || !eligibleMonth(key)) return;
    const enquiries = cached.enquiries.filter(item => {
      const date = toDate(item.createdAt);
      return date && monthKey(date) === key;
    });
    const logs = cached.auditLogs.filter(item => {
      const date = toDate(item.createdAt);
      return date && monthKey(date) === key;
    });
    if (!enquiries.length && !logs.length) {
      say("No records found for this month. Nothing was changed.");
      return;
    }

    const enquiryRows = enquiries.map((item, index) => {
      const date = toDate(item.createdAt);
      return '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(item.name || "—") + '</td><td>' + escapeHtml(item.phone || "—") + '</td><td>' + escapeHtml(item.serviceType || "general") + '</td><td>' + escapeHtml(item.interest || "—") + '</td><td>' + escapeHtml(item.status || "new") + '</td><td>' + escapeHtml(date ? date.toLocaleString() : "Unknown") + '</td><td dir="auto">' + escapeHtml(item.message || "—") + '</td></tr>';
    }).join("");
    const auditRows = logs.map((item, index) => {
      const date = toDate(item.createdAt);
      return '<tr><td>' + (index + 1) + '</td><td>' + escapeHtml(item.action || "Activity") + '</td><td>' + escapeHtml(item.actorEmail || item.actorUid || "—") + '</td><td>' + escapeHtml(item.entityType || "—") + ' / ' + escapeHtml(item.entityId || "—") + '</td><td>' + escapeHtml(Array.isArray(item.changedFields) ? item.changedFields.join(", ") : "—") + '</td><td>' + escapeHtml((item.fromStatus || "—") + " → " + (item.toStatus || "—")) + '</td><td>' + escapeHtml(date ? date.toLocaleString() : "Unknown") + '</td></tr>';
    }).join("");

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      say("Your browser blocked the archive window. Allow pop-ups for this website and try again. Nothing was deleted.");
      return;
    }
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>Al Naseem Archive ' + key + '</title><style>body{font-family:Arial,"Noto Sans",sans-serif;color:#183b2d;margin:24px;font-size:11px}h1{font-size:20px;margin-bottom:4px}h2{font-size:15px;margin-top:28px}p{color:#52665a}table{width:100%;border-collapse:collapse;margin:12px 0 22px;table-layout:auto}th,td{border:1px solid #ccd7ce;padding:6px;text-align:left;vertical-align:top;overflow-wrap:anywhere}th{background:#edf3ee}td{white-space:normal}.meta{margin:14px 0 22px}@media print{body{margin:12mm}h2{break-after:avoid}tr{break-inside:avoid}table{font-size:9px}}</style></head><body><h1>AL NASEEM GROUP — MONTHLY RECORDS ARCHIVE</h1><p class="meta">Period: ' + escapeHtml(monthTitle(key)) + ' | Generated: ' + escapeHtml(new Date().toLocaleString()) + '<br>Enquiries: ' + enquiries.length + ' | Audit entries: ' + logs.length + '</p><h2>Customer enquiries</h2><table><thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Service</th><th>Interest</th><th>Status</th><th>Date</th><th>Message</th></tr></thead><tbody>' + enquiryRows + '</tbody></table><h2>Staff activity / audit history</h2><table><thead><tr><th>#</th><th>Action</th><th>Staff</th><th>Record</th><th>Changed fields</th><th>Status change</th><th>Date</th></tr></thead><tbody>' + auditRows + '</tbody></table><p>Company record copy — keep this PDF securely in the company records folder.</p><script>window.onload=function(){window.focus();window.print();};<\/script></body></html>';
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    pending = { key, enquiries, logs };
    savedCheck.checked = false;
    confirmButton.disabled = true;
    confirmPanel.hidden = false;
    say("Print window opened. Choose 'Save as PDF' in the print destination, save it on the company PC, open and check the file. Do not confirm before that.");
  }
  async function commitAndPurge() {
    if (!pending || !savedCheck.checked) return;
    confirmButton.disabled = true;
    confirmButton.textContent = "Clearing archived records…";
    try {
      const { key, enquiries, logs } = pending;
      const markerRef = doc(db, "archiveRuns", key);
      const existing = await getDoc(markerRef);
      if (!existing.exists()) await setDoc(markerRef, {
        monthKey: key,
        confirmedBy: auth.currentUser.uid,
        confirmedByEmail: auth.currentUser.email || "",
        confirmedAt: serverTimestamp(),
        pdfDownloaded: true,
        enquiryCount: enquiries.length,
        auditCount: logs.length
      });

      const enquiryIds = new Set(enquiries.map(item => item.id));
      const auditIds = new Set(logs.map(item => item.id));
      const [currentEnquiries, currentLogs] = await Promise.all([
        getDocs(collection(db, "enquiries")),
        getDocs(collection(db, "auditLogs"))
      ]);
      const deletions = [
        ...currentEnquiries.docs.filter(item => enquiryIds.has(item.id) && item.data().archiveMonth === key).map(item => ({ source: "enquiries", id: item.id })),
        ...currentLogs.docs.filter(item => auditIds.has(item.id) && item.data().archiveMonth === key).map(item => ({ source: "auditLogs", id: item.id }))
      ];
      for (let i = 0; i < deletions.length; i += 400) {
        const batch = writeBatch(db);
        deletions.slice(i, i + 400).forEach(item => batch.delete(doc(db, item.source, item.id)));
        await batch.commit();
      }
      say("Archive confirmed. " + enquiries.length + " enquiries and " + logs.length + " audit entries were removed from live Firestore. Keep the PDF safely on the company PC.");
      pending = null;
      confirmPanel.hidden = true;
      confirmButton.textContent = "Confirm saved & clear archived records";
      await refresh();
    } catch (error) {
      console.error("Archive purge failed:", error);
      say("Archive cleanup did not finish. Keep the PDF. Some records may remain in Firebase; contact Super Admin before retrying. Error: " + (error.code || error.message || "unknown"));
      confirmButton.disabled = false;
      confirmButton.textContent = "Retry clearing archived records";
    }
  }

  downloadButton.addEventListener("click", download);
  savedCheck.addEventListener("change", () => { confirmButton.disabled = !savedCheck.checked; });
  confirmButton.addEventListener("click", commitAndPurge);
  refresh();
}
