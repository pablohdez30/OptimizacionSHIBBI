import { jsPDF } from "jspdf";
import {
  ConfigMap,
  PresupuestoCarga,
  fechaEs,
  fetchAsset,
  fmtNum,
} from "./utils";

// A4 medidas en mm: 210 x 297. Todo el módulo trabaja en mm.
const PAGE_W = 210;
const MARGIN_L = 20;
const MARGIN_R = 20;
const MARGIN_T = 15;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

// Columnas del listado de productos (anchuras en mm)
const COL_CONCEPTO = 85;
const COL_UNIDADES = 25;
const COL_PX = 30;
const COL_TOTAL = 30;

function ab2base64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
  // btoa disponible en navegador
  return btoa(bin);
}

export async function generarPdfPresupuesto(
  pres: PresupuestoCarga,
  config: ConfigMap
): Promise<Blob> {
  const empresa_nombre = config.empresa_nombre || "CAESPAN ARGUMENT S.L.";
  const empresa_dir = config.empresa_direccion || "";
  const empresa_ciudad = config.empresa_ciudad || "";
  const empresa_cif = config.empresa_cif || "";
  const empresa_cuenta = config.empresa_cuenta_bancaria || "";
  const iva_pct = parseFloat(config.iva_porcentaje || "21");

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  doc.setFont("helvetica", "normal");

  // --- Header: logo izq + empresa der ---
  const logoBuf = await fetchAsset("/logo_shibbi.jpg").catch(() => null);
  if (logoBuf) {
    const logoB64 = ab2base64(logoBuf);
    doc.addImage(
      `data:image/jpeg;base64,${logoB64}`,
      "JPEG",
      MARGIN_L,
      MARGIN_T,
      50,
      14
    );
  }

  // Empresa (alineado a la derecha)
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  const empresaLines = [empresa_nombre, empresa_dir, empresa_ciudad, empresa_cif];
  let y = MARGIN_T + 3;
  empresaLines.forEach((line, i) => {
    if (line) {
      doc.text(line, PAGE_W - MARGIN_R, y + i * 4.5, { align: "right" });
    }
  });

  y = MARGIN_T + 22;

  // --- Info del presupuesto + cliente ---
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PRESUPUESTO  Nº:", MARGIN_L, y);
  doc.text(pres.numero_presupuesto, MARGIN_L + 40, y);
  // Línea separadora
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, y + 1.5, MARGIN_L + 90, y + 1.5);
  y += 5.5;

  doc.setFont("helvetica", "normal");
  doc.text("FECHA:", MARGIN_L, y);
  doc.text(fechaEs(pres.fecha), MARGIN_L + 40, y);
  y += 5;

  doc.text("CLIENTE:", MARGIN_L, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(pres.cliente_nombre, MARGIN_L + 40, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  y += 5.5;

  doc.text("DIRECCIÓN:", MARGIN_L, y);
  doc.text(pres.cliente_direccion || "", MARGIN_L + 40, y);
  y += 5;

  doc.text("C.I.F./N.I.F:", MARGIN_L, y);
  doc.text(pres.cliente_nif || "", MARGIN_L + 40, y);
  y += 10;

  // --- Cabecera de la tabla de productos ---
  const xConcepto = MARGIN_L;
  const xUnidades = MARGIN_L + COL_CONCEPTO;
  const xPX = xUnidades + COL_UNIDADES;
  const xTotal = xPX + COL_PX;
  const xRight = MARGIN_L + CONTENT_W;

  doc.setLineWidth(0.7);
  doc.line(xConcepto, y, xRight, y);
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.text("Concepto", xConcepto, y);
  doc.text("Unidades", xUnidades + COL_UNIDADES, y, { align: "right" });
  doc.text("PX", xPX + COL_PX, y, { align: "right" });
  doc.text("Total", xTotal + COL_TOTAL, y, { align: "right" });
  y += 1.5;
  doc.setLineWidth(0.2);
  doc.line(xConcepto, y, xRight, y);
  y += 3.5;

  // --- Líneas ---
  doc.setFont("helvetica", "normal");
  let totalBase = 0;

  for (const linea of pres.lineas) {
    // Salto de página si hace falta
    if (y > 240) {
      doc.addPage();
      y = MARGIN_T + 10;
    }
    const total = linea.precio_unitario_final * linea.cantidad;
    totalBase += total;

    doc.setFont("helvetica", "bold");
    doc.text(linea.nombre_producto, xConcepto, y);
    doc.text(String(linea.cantidad), xUnidades + COL_UNIDADES, y, {
      align: "right",
    });
    doc.text(fmtNum(linea.precio_unitario_final), xPX + COL_PX, y, {
      align: "right",
    });
    doc.text(fmtNum(total), xTotal + COL_TOTAL, y, { align: "right" });
    y += 5;

    // Descripción (cada línea del texto por separado)
    if (linea.descripcion) {
      doc.setFont("helvetica", "normal");
      for (const desc of linea.descripcion.split("\n")) {
        if (!desc.trim()) continue;
        const wrapped = doc.splitTextToSize(desc.trim(), COL_CONCEPTO);
        for (const w of wrapped) {
          if (y > 250) {
            doc.addPage();
            y = MARGIN_T + 10;
          }
          doc.text(w, xConcepto, y);
          y += 4.5;
        }
      }
    }
    y += 2;
  }

  // --- Línea de Porte/Instalación (si aplica) ---
  if (pres.incluye_instalacion) {
    if (y > 250) {
      doc.addPage();
      y = MARGIN_T + 10;
    }
    doc.setFont("helvetica", "bold");
    if (pres.porte_importe > 0) {
      // Importe definido: línea con unidades, PX y total
      doc.text("Porte / Instalación", xConcepto, y);
      doc.text("1", xUnidades + COL_UNIDADES, y, { align: "right" });
      doc.text(fmtNum(pres.porte_importe), xPX + COL_PX, y, { align: "right" });
      doc.text(fmtNum(pres.porte_importe), xTotal + COL_TOTAL, y, {
        align: "right",
      });
      totalBase += pres.porte_importe;
      y += 7;
    } else {
      // Marcado como incluido pero sin importe: nota sin columnas
      doc.text("Porte / Instalación incluido", xConcepto, y);
      y += 7;
    }
  } else {
    // Nota informativa: porte no incluido (sin línea de precio)
    y += 4;
    if (y > 265) {
      doc.addPage();
      y = MARGIN_T + 10;
    }
    doc.setFont("helvetica", "bold");
    doc.text("Porte / Instalación no incluido", MARGIN_L, y);
    y += 6;
  }

  y += 4;

  // --- Caja de totales (alineada a la derecha) ---
  const iva = totalBase * (iva_pct / 100);
  const totalFinal = totalBase + iva;

  const boxW = 80;
  const boxX = PAGE_W - MARGIN_R - boxW;
  const lineH = 6;
  const boxH = lineH * 3 + 4;

  if (y + boxH > 280) {
    doc.addPage();
    y = MARGIN_T + 10;
  }

  doc.setLineWidth(0.4);
  doc.rect(boxX, y, boxW, boxH);
  doc.setFont("helvetica", "normal");

  const rowY1 = y + 4;
  const rowY2 = rowY1 + lineH;
  const rowY3 = rowY2 + lineH;
  // separador entre IVA y TOTAL (en el hueco entre ambas filas)
  doc.setLineWidth(0.3);
  doc.line(boxX, rowY3 - 4.5, boxX + boxW, rowY3 - 4.5);

  doc.text("Total Base", boxX + 3, rowY1);
  doc.text(`${fmtNum(totalBase)} €`, boxX + boxW - 3, rowY1, { align: "right" });

  doc.text(`I.V.A ${iva_pct.toFixed(0)}%`, boxX + 3, rowY2);
  doc.text(`${fmtNum(iva)} €`, boxX + boxW - 3, rowY2, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text("TOTAL", boxX + 3, rowY3);
  doc.text(`${fmtNum(totalFinal)} €`, boxX + boxW - 3, rowY3, { align: "right" });

  y += boxH + 7;

  // --- Caja de condiciones de pago ---
  if (y + 28 > 280) {
    doc.addPage();
    y = MARGIN_T + 10;
  }
  const condX = MARGIN_L;
  const condW = CONTENT_W;
  const condText =
    pres.condiciones_pago ||
    "50% adelanto-50% antes de la entrega del trabajo.";
  const condLines = [
    "CONDICIONES DE PAGO:",
    condText,
    `Los presupuestos caducan a los ${pres.dias_validez || 15} días`,
  ];
  const condH = condLines.length * 5.2 + 3;
  doc.setLineWidth(0.4);
  doc.rect(condX, y, condW, condH);
  doc.setFont("helvetica", "bold");
  doc.text(condLines[0], condX + 3, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text(condLines[1], condX + 3, y + 10);
  doc.text(condLines[2], condX + 3, y + 15.2);
  y += condH + 4;

  // --- Línea transferencia ---
  if (y > 285) {
    doc.addPage();
    y = MARGIN_T + 10;
  }
  doc.setFont("helvetica", "bold");
  doc.text(
    `Pago mediante transferencia bancaria: CC: ${empresa_cuenta}`,
    MARGIN_L,
    y
  );

  return doc.output("blob");
}
