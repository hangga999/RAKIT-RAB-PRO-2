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
 * Loads and registers the Aptos & Aptos Bold fonts into the given jsPDF document.
 * Returns "Aptos" if loaded successfully, or falls back to "helvetica".
 */
export async function setupAptosFont(doc: jsPDF): Promise<string> {
  try {
    if (typeof window === "undefined") {
      return "helvetica";
    }

    if (!aptosNormalBase64) {
      try {
        const res = await fetch("/fonts/Aptos.ttf");
        if (res.ok) {
          const buf = await res.arrayBuffer();
          aptosNormalBase64 = arrayBufferToBase64(buf);
        }
      } catch (e) {
        console.warn("Could not fetch Aptos.ttf", e);
      }
    }

    if (!aptosBoldBase64) {
      try {
        const resBold = await fetch("/fonts/Aptos-Bold.ttf");
        if (resBold.ok) {
          const buf = await resBold.arrayBuffer();
          aptosBoldBase64 = arrayBufferToBase64(buf);
        }
      } catch (e) {
        console.warn("Could not fetch Aptos-Bold.ttf", e);
      }
    }

    if (aptosNormalBase64) {
      doc.addFileToVFS("Aptos-Regular.ttf", aptosNormalBase64);
      doc.addFont("Aptos-Regular.ttf", "Aptos", "normal");
    }

    if (aptosBoldBase64) {
      doc.addFileToVFS("Aptos-Bold.ttf", aptosBoldBase64);
      doc.addFont("Aptos-Bold.ttf", "Aptos", "bold");
    }

    if (aptosNormalBase64) {
      doc.setFont("Aptos", "normal");
      return "Aptos";
    }
  } catch (err) {
    console.warn("Error setting up Aptos font in jsPDF, falling back to Helvetica:", err);
  }
  return "helvetica";
}
