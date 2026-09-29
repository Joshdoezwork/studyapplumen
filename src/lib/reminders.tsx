import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SENT_KEY = "lumen.reminders.sent";

function canUseSW() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return false;
  const inIframe = (() => { try { return window.self !== window.top; } catch { return true; } })();
  const preview = location.hostname.includes("id-preview--") || location.hostname.includes("lovableproject.com");
  return !inIframe && !preview;
}

async function getReg() {
  if (!canUseSW()) return null;
  try { return (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js")); }
  catch { return null; }
}

export async function notify(title: string, body: string, url = "/planner") {
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    const reg = await getReg();
    if (reg) { await reg.showNotification(title, { body, icon: "/favicon.ico", data: { url } }); return; }
    try { new Notification(title, { body }); return; } catch { /* mobile needs SW */ }
  }
  toast(title, { description: body });
}

export function useNotificationPermission() {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  useEffect(() => { setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission); }, []);
  const request = async () => {
    if (typeof Notification === "undefined") { toast.error("This browser doesn't support notifications. On iPhone, add Lumen to your Home Screen first."); return; }
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") { await getReg(); notify("Reminders on 🎉", "You'll get alerts for upcoming study sessions and exams."); }
    else toast.error("Notifications were blocked — enable them in your browser settings.");
  };
  return { perm, request };
}

/** App-wide poller: alerts 60 min and 10 min before events, and the day before exams. */
export function useStudyReminders(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    getReg();
    const check = async () => {
      const now = Date.now();
      const { data } = await supabase
        .from("planner_events")
        .select("id,title,type,subject,starts_at")
        .eq("user_id", userId)
        .gte("starts_at", new Date(now).toISOString())
        .lte("starts_at", new Date(now + 26 * 3600_000).toISOString());
      const sent: Record<string, number> = JSON.parse(localStorage.getItem(SENT_KEY) || "{}");
      for (const e of data ?? []) {
        const mins = Math.round((new Date(e.starts_at).getTime() - now) / 60_000);
        const label = e.subject ? ` · ${e.subject}` : "";
        const windows: [string, boolean, string][] = [
          [`${e.id}:10`, mins <= 10, `⏰ ${e.title} in ${mins} min`],
          [`${e.id}:60`, mins <= 60 && mins > 10, `⏰ ${e.title} in ${mins} min`],
          [`${e.id}:day`, e.type === "exam" && mins <= 24 * 60 && mins > 60, `📚 Exam tomorrow: ${e.title}`],
        ];
        for (const [k, due, title] of windows) {
          if (due && !sent[k]) { sent[k] = now; await notify(title, `${e.type}${label}`); }
        }
      }
      for (const k of Object.keys(sent)) if (now - sent[k] > 3 * 86400_000) delete sent[k];
      localStorage.setItem(SENT_KEY, JSON.stringify(sent));
    };
    check();
    const id = setInterval(check, 60_000);
    const onVis = () => document.visibilityState === "visible" && check();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [userId]);
}
