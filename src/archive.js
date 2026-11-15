import { jsPDF } from "jspdf";
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
  return new Date(year, month + 1, 1) <= new Date();
};

function addParagraph(pdf, value, y, fontSize = 9) {
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(String(value ?? "—"), 180);
  if (y + lines.length * 4.5 > 282) {
    pdf.addPage();
    y = 18;
  }
  pdf.text(lines, 14, y);
  return y + lines.length * 4.5 + 2;
}

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

    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    let y = 18;
    pdf.setFont("helvetica", "bold");
    y = addParagraph(pdf, "AL NASEEM GROUP — MONTHLY RECORDS ARCHIVE", y, 16);
    pdf.setFont("helvetica", "normal");
    y = addParagraph(pdf, "Period: " + monthTitle(key), y, 10);
    y = addParagraph(pdf, "Generated: " + new Date().toLocaleString(), y, 9);
    y = addParagraph(pdf, "Enquiries: " + enquiries.length + " | Audit entries: " + logs.length, y, 9);
    y += 4;
    pdf.setFont("helvetica", "bold");
    y = addParagraph(pdf, "CUSTOMER ENQUIRIES", y, 12);
    pdf.setFont("helvetica", "normal");
    enquiries.forEach((item, index) => {
      const date = toDate(item.createdAt);
      y = addParagraph(pdf, (index + 1) + ". " + (item.name || "Name not provided"), y);
      y = addParagraph(pdf, "Date: " + (date ? date.toLocaleString() : "Unknown") + " | Type: " + (item.serviceType || "general") + " | Status: " + (item.status || "new"), y);
      y = addParagraph(pdf, "Phone: " + (item.phone || "—") + " | Interest: " + (item.interest || "—"), y);
      y = addParagraph(pdf, "Message: " + (item.message || "—"), y);
      y += 2;
    });
    if (logs.length) {
      if (y > 265) { pdf.addPage(); y = 18; }
      pdf.setFont("helvetica", "bold");
      y = addParagraph(pdf, "STAFF ACTIVITY / AUDIT HISTORY", y, 12);
      pdf.setFont("helvetica", "normal");
      logs.forEach((item, index) => {
        const date = toDate(item.createdAt);
        y = addParagraph(pdf, (index + 1) + ". " + (item.action || "Activity"), y);
        y = addParagraph(pdf, "Date: " + (date ? date.toLocaleString() : "Unknown") + " | Staff: " + (item.actorEmail || item.actorUid || "—"), y);
        y = addParagraph(pdf, "Record: " + (item.entityType || "—") + " / " + (item.entityId || "—") + " | Changed: " + (Array.isArray(item.changedFields) ? item.changedFields.join(", ") : "—"), y);
        if (item.fromStatus || item.toStatus) y = addParagraph(pdf, "Status: " + (item.fromStatus || "—") + " → " + (item.toStatus || "—"), y);
        y += 2;
      });
    }
    pdf.save("Al-Naseem-Archive-" + key + ".pdf");
    pending = { key, enquiries, logs };
    savedCheck.checked = false;
    confirmButton.disabled = true;
    confirmPanel.hidden = false;
    say("The PDF download has been requested. Open it, check the contents and save it securely on the company PC. Do not confirm before that.");
  }

  async function commitAndPurge() {
    if (!pending || !savedCheck.checked) return;
    confirmButton.disabled = true;
    confirmButton.textContent = "Clearing archived records…";
    try {
      const { key, enquiries, logs } = pending;
      const markerRef = doc(db, "archiveRuns", key);
      const existing = await getDoc(markerRef);
      if (existing.exists() && existing.data().confirmedBy !== auth.currentUser.uid) {
        throw new Error("This month has an archive marker created by another staff member. Contact Super Admin.");
      }
      if (!existing.exists()) await setDoc(markerRef, {
        monthKey: key,
        confirmedBy: auth.currentUser.uid,
        confirmedByEmail: auth.currentUser.email || "",
        confirmedAt: serverTimestamp(),
        pdfDownloaded: true,
        enquiryCount: enquiries.length,
        auditCount: logs.length
      });

      const all = [
        ...enquiries.map(item => ({ ...item, source: "enquiries" })),
        ...logs.map(item => ({ ...item, source: "auditLogs" }))
      ];
      for (let i = 0; i < all.length; i += 400) {
        const batch = writeBatch(db);
        all.slice(i, i + 400).forEach(item => {
          batch.update(doc(db, item.source, item.id), { archiveMonth: key });
        });
        await batch.commit();
      }
      for (let i = 0; i < all.length; i += 400) {
        const batch = writeBatch(db);
        all.slice(i, i + 400).forEach(item => batch.delete(doc(db, item.source, item.id)));
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
