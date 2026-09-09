import jsPDF from "jspdf";

let aptosNormalBase64: string | null = null;
let aptosBoldBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Validates whether the fetched buffer is actually a TrueType or OpenType font,
 * and NOT an HTML document returned by SPA fallback routing.
 */
function isValidTtfBuffer(buffer: ArrayBuffer): boolean {
  if (!buffer || buffer.byteLength < 12) return false;
  const v = new Uint8Array(buffer.slice(0, 4));
  // Standard TTF (0x00010000), Apple TrueType ('true'), OpenType ('OTTO'), or WOFF ('wOFF')
  const isTtf = v[0] === 0x00 && v[1] === 0x01 && v[2] === 0x00 && v[3] === 0x00;
  const isTrue = v[0] === 0x74 && v[1] === 0x72 && v[2] === 0x75 && v[3] === 0x65;
  const isOtto = v[0] === 0x4F && v[1] === 0x54 && v[2] === 0x54 && v[3] === 0x4F;
  return isTtf || isTrue || isOtto;
}

/**
 * Loads and registers the Aptos font into the given jsPDF document.
 * Returns "Aptos" if loaded successfully, or safely falls back to "helvetica".
 */
export async function setupAptosFont(doc: jsPDF): Promise<string> {
  try {
    if (typeof window === "undefined" || !doc) {
      return "helvetica";
    }

    // Check if Aptos is already registered in this doc instance
    const existingFonts = doc.getFontList?.() || {};
    if (existingFonts["Aptos"]) {
      doc.setFont("Aptos", "normal");
      return "Aptos";
    }

    // Fetch Regular font if not already cached
    if (!aptosNormalBase64) {
      try {
        const res = await fetch("/fonts/Aptos.ttf");
        const contentType = res.headers.get("content-type") || "";
        if (res.ok && !contentType.includes("text/html")) {
          const buf = await res.arrayBuffer();
          if (isValidTtfBuffer(buf)) {
            aptosNormalBase64 = arrayBufferToBase64(buf);
          }
        }
      } catch (e) {
        console.warn("Could not fetch /fonts/Aptos.ttf", e);
      }
    }

    // Fetch Bold font if not already cached
    if (!aptosBoldBase64) {
      try {
        const resBold = await fetch("/fonts/Aptos-Bold.ttf");
        const contentType = resBold.headers.get("content-type") || "";
        if (resBold.ok && !contentType.includes("text/html")) {
          const buf = await resBold.arrayBuffer();
          if (isValidTtfBuffer(buf)) {
            aptosBoldBase64 = arrayBufferToBase64(buf);
          }
        }
      } catch (e) {
        console.warn("Could not fetch /fonts/Aptos-Bold.ttf", e);
      }
    }

    // If bold font file wasn't found or invalid, fallback to normal font data for bold variant
    const boldBase64ToUse = aptosBoldBase64 || aptosNormalBase64;

    if (aptosNormalBase64) {
      try {
        doc.addFileToVFS("Aptos-Regular.ttf", aptosNormalBase64);
        doc.addFont("Aptos-Regular.ttf", "Aptos", "normal");

        if (boldBase64ToUse) {
          doc.addFileToVFS("Aptos-Bold.ttf", boldBase64ToUse);
          doc.addFont("Aptos-Bold.ttf", "Aptos", "bold");
        }

        doc.setFont("Aptos", "normal");
        return "Aptos";
      } catch (fontAddErr) {
        console.warn("jsPDF addFont failed for Aptos, falling back to helvetica:", fontAddErr);
        doc.setFont("helvetica", "normal");
        return "helvetica";
      }
    }
  } catch (err) {
    console.warn("Error setting up Aptos font in jsPDF, falling back to Helvetica:", err);
  }

  doc.setFont("helvetica", "normal");
  return "helvetica";
}

