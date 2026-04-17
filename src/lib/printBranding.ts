import { defaultSettings, KEYS, type SchoolSettings } from "@/lib/storage";
import logoImg from "@/assets/logo.png";

export function getSchoolSettings(): SchoolSettings {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export function brandedPrintHeader(title?: string): string {
  const s = getSchoolSettings();
  return `
<div class="brand-header" style="text-align:center;border-bottom:3px solid #04844B;padding-bottom:12px;margin-bottom:18px">
  <img src="${logoImg}" alt="Logo" style="width:60px;height:60px;border-radius:50%;display:block;margin:0 auto 6px" />
  <h1 style="margin:4px 0;font-size:18px;color:#04844B;font-family:Arial,sans-serif">${s.name}</h1>
  <p style="margin:2px 0;font-size:11px;color:#555;font-family:Arial,sans-serif;font-style:italic">"${s.motto}"</p>
  <p style="margin:2px 0;font-size:11px;color:#555;font-family:Arial,sans-serif">${s.location} • ${s.phone} • ${s.email}</p>
  ${title ? `<p style="font-weight:bold;margin-top:8px;color:#04844B;font-family:Arial,sans-serif">${title}</p>` : ""}
</div>`;
}

export function brandedPrintFooter(): string {
  const s = getSchoolSettings();
  return `<div style="text-align:center;margin-top:24px;font-size:10px;color:#888;font-family:Arial,sans-serif;border-top:1px solid #ddd;padding-top:8px">
    ${s.name} • ${s.academicYear} • ${s.currentTerm} • Generated ${new Date().toLocaleDateString("en-GB")}
  </div>`;
}
