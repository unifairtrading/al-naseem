import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} from "@firebase/rules-unit-testing";
import {
  collection, deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc
} from "firebase/firestore";
import { readFile } from "node:fs/promises";

const projectId = "al-naseem-rules-tests";
let testEnv;
const oldDate = Timestamp.fromMillis(Date.now() - 35 * 24 * 60 * 60 * 1000);
const freshDate = Timestamp.fromMillis(Date.now() - 2 * 24 * 60 * 60 * 1000);

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    firestore: {
      rules: await readFile(new URL("../firestore.rules", import.meta.url), "utf8")
    }
  });
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await setDoc(doc(db, "users", "super-1"), { role: "super_admin", email: "super@example.test" });
    await setDoc(doc(db, "users", "staff-1"), { role: "staff_admin", email: "staff@example.test" });
    await setDoc(doc(db, "users", "ordinary-1"), { role: "customer" });
    await setDoc(doc(db, "enquiries", "old-enquiry"), {
      name: "Old customer", phone: "+97300000000", interest: "Umrah",
      serviceType: "umrah", message: "Old request", status: "new",
      archiveMonth: "2026-09", createdAt: oldDate
    });
    await setDoc(doc(db, "enquiries", "fresh-enquiry"), {
      name: "Fresh customer", phone: "+97300000001", interest: "Hotel",
      serviceType: "hotel", message: "Recent request", status: "new",
      archiveMonth: "2026-11", createdAt: freshDate
    });
    await setDoc(doc(db, "auditLogs", "old-log"), {
      actorUid: "staff-1", actorEmail: "staff@example.test", action: "old_change",
      entityType: "enquiry", entityId: "old-enquiry", changedFields: ["status"],
      fromStatus: "new", toStatus: "closed", archiveMonth: "2026-09", createdAt: oldDate
    });
    await setDoc(doc(db, "auditLogs", "fresh-log"), {
      actorUid: "staff-1", actorEmail: "staff@example.test", action: "fresh_change",
      entityType: "enquiry", entityId: "fresh-enquiry", changedFields: ["status"],
      fromStatus: "new", toStatus: "contacted", archiveMonth: "2026-11", createdAt: freshDate
    });
  });
});

after(async () => {
  await testEnv?.cleanup();
});

async function createArchiveMarker() {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertSucceeds(setDoc(doc(db, "archiveRuns", "2026-09"), {
    monthKey: "2026-09",
    confirmedBy: "staff-1",
    confirmedByEmail: "staff@example.test",
    confirmedAt: serverTimestamp(),
    pdfDownloaded: true,
    enquiryCount: 1,
    auditCount: 1
  }));
}

test("public visitors can submit valid enquiries without authentication", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertSucceeds(setDoc(doc(collection(db, "enquiries")), {
    name: "Public visitor", phone: "+97312345678", interest: "Umrah",
    serviceType: "umrah", message: "Please contact me", status: "new",
    archiveMonth: "2026-11", createdAt: serverTimestamp()
  }));
});

test("public visitors cannot read or delete enquiries", async () => {
  const db = testEnv.unauthenticatedContext().firestore();
  await assertFails(getDoc(doc(db, "enquiries", "old-enquiry")));
  await assertFails(deleteDoc(doc(db, "enquiries", "old-enquiry")));
});

test("staff can create a confirmed archive marker but cannot edit or delete it", async () => {
  await createArchiveMarker();
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertFails(setDoc(doc(db, "archiveRuns", "2026-09"), {
    monthKey: "2026-09", confirmedBy: "staff-1", confirmedByEmail: "staff@example.test",
    confirmedAt: serverTimestamp(), pdfDownloaded: true, enquiryCount: 999, auditCount: 1
  }));
  const superDb = testEnv.authenticatedContext("super-1").firestore();
  const { deleteDoc: removeMarker } = await import("firebase/firestore");
  await assertFails(removeMarker(doc(superDb, "archiveRuns", "2026-09")));
});

test("staff cannot purge records before a confirmed archive marker exists", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertFails(deleteDoc(doc(db, "enquiries", "old-enquiry")));
  await assertFails(deleteDoc(doc(db, "auditLogs", "old-log")));
});

test("confirmed archive allows old enquiry and audit deletion only", async () => {
  await createArchiveMarker();
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertSucceeds(deleteDoc(doc(db, "enquiries", "old-enquiry")));
  await assertSucceeds(deleteDoc(doc(db, "auditLogs", "old-log")));
  await assertFails(deleteDoc(doc(db, "enquiries", "fresh-enquiry")));
  await assertFails(deleteDoc(doc(db, "auditLogs", "fresh-log")));
});

test("staff cannot delete recent records even after creating a marker for that month", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertSucceeds(setDoc(doc(db, "archiveRuns", "2026-11"), {
    monthKey: "2026-11", confirmedBy: "staff-1", confirmedByEmail: "staff@example.test",
    confirmedAt: serverTimestamp(), pdfDownloaded: true, enquiryCount: 1, auditCount: 1
  }));
  await assertFails(deleteDoc(doc(db, "enquiries", "fresh-enquiry")));
  await assertFails(deleteDoc(doc(db, "auditLogs", "fresh-log")));
});

test("staff cannot create audit logs attributed to another user", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertFails(setDoc(doc(db, "auditLogs", "forged-log"), {
    actorUid: "super-1", actorEmail: "super@example.test", action: "forged",
    entityType: "enquiry", entityId: "fresh-enquiry", changedFields: ["status"],
    archiveMonth: "2026-11", createdAt: serverTimestamp()
  }));
});

test("staff can change enquiry status but cannot rewrite its archive month", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertSucceeds(updateDoc(doc(db, "enquiries", "old-enquiry"), { status: "contacted" }));
  await assertFails(updateDoc(doc(db, "enquiries", "old-enquiry"), { archiveMonth: "2026-01" }));
});

test("audit history is append-only before archive cleanup", async () => {
  const db = testEnv.authenticatedContext("staff-1").firestore();
  await assertFails(updateDoc(doc(db, "auditLogs", "old-log"), { action: "rewritten" }));
  await assertFails(deleteDoc(doc(db, "auditLogs", "old-log")));
});
