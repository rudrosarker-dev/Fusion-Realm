"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";

// দুই-ধাপ যাচাই (TOTP) সেটআপ/বন্ধ করার ছোট প্যানেল — অ্যাডমিন ও স্টাফ দুই জায়গায় ব্যবহৃত
export function MfaPanel() {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [secret, setSecret] = useState("");
  const [uri, setUri] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/mfa", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setEnabled(Boolean(d.enabled)))
      .catch(() => {});
  }, [open]);

  const call = async (body: Record<string, string>) => {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/mfa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) setMsg(d.error || "Failed");
      return res.ok ? d : null;
    } catch {
      setMsg("Network error");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const setup = async () => {
    const d = await call({ action: "setup" });
    if (d) {
      setSecret(d.secret);
      setUri(d.uri);
    }
  };
  const enable = async () => {
    const d = await call({ action: "enable", code });
    if (d) {
      setEnabled(true);
      setSecret("");
      setUri("");
      setCode("");
      setMsg(d.message);
    }
  };
  const disable = async () => {
    const d = await call({ action: "disable", code, password });
    if (d) {
      setEnabled(false);
      setCode("");
      setPassword("");
      setMsg(d.message);
    }
  };

  const input = "w-full bg-white/5 border border-white/15 px-3 py-2 text-xs text-white font-mono outline-none focus:border-white/60";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/70 hover:text-white cursor-pointer font-mono"
      >
        <ShieldCheck className="size-3.5" /> 2FA {enabled ? "(on)" : "(off)"}
      </button>
      {open && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm space-y-3 border border-white/15 bg-black p-5 text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-sm tracking-wider">Two-Factor Authentication</h3>
              <button type="button" onClick={() => setOpen(false)} className="cursor-pointer" aria-label="Close">
                <X className="size-4" />
              </button>
            </div>

            {enabled === false && !secret && (
              <button type="button" disabled={busy} onClick={setup} className="w-full bg-[#dfcaa8] py-2 text-xs font-semibold uppercase tracking-widest text-black cursor-pointer">
                Enable 2FA
              </button>
            )}

            {secret && (
              <div className="space-y-2 text-xs">
                <p className="text-white/70">Google Authenticator / Authy-তে এই কী যোগ করুন (Time-based):</p>
                <p className="break-all border border-white/15 bg-white/5 p-2 font-mono tracking-widest">{secret}</p>
                <p className="break-all text-[10px] text-white/40 font-mono">{uri}</p>
                <input className={input} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button type="button" disabled={busy} onClick={enable} className="w-full bg-[#dfcaa8] py-2 text-xs font-semibold uppercase tracking-widest text-black cursor-pointer">
                  Confirm & Enable
                </button>
              </div>
            )}

            {enabled && (
              <div className="space-y-2 text-xs">
                <p className="text-emerald-400">2FA সক্রিয় আছে।</p>
                <p className="text-white/50">বন্ধ করতে পাসওয়ার্ড ও বর্তমান কোড দিন:</p>
                <input className={input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <input className={input} inputMode="numeric" maxLength={6} placeholder="6-digit code" value={code} onChange={(e) => setCode(e.target.value)} />
                <button type="button" disabled={busy} onClick={disable} className="w-full border border-red-500/40 py-2 text-xs uppercase tracking-widest text-red-400 cursor-pointer">
                  Disable 2FA
                </button>
              </div>
            )}

            {msg && <p className="text-xs text-white/70">{msg}</p>}
          </div>
        </div>
      )}
    </>
  );
}
