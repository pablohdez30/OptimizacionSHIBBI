import ExcelJS from "exceljs";
import {
  ConfigMap,
  PresupuestoCarga,
  fetchAsset,
  textoPorteInstalacion,
} from "./utils";

// Carga PresupuestoPlantilla.xlsx desde /public, rellena los campos y devuelve blob.
// Replica la disposición exacta de excel_template.py (celdas, fonts, formato).
export async function generarExcelPresupuesto(
  pres: PresupuestoCarga,
  config: ConfigMap
): Promise<Blob> {
  const empresa_nombre = config.empresa_nombre || "CAESPAN ARGUMENT S.L.";
  const empresa_dir = config.empresa_direccion || "";
  const empresa_ciudad = config.empresa_ciudad || "";
  const empresa_cif = config.empresa_cif || "";
  const empresa_cuenta = config.empresa_cuenta_bancaria || "";
  const iva_pct = parseFloat(config.iva_porcentaje || "21");

  const templateBuf = await fetchAsset("/PresupuestoPlantilla.xlsx");
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(templateBuf);
  const ws = wb.worksheets[0];

  // Logo
  try {
    const logoBuf = await fetchAsset("/logo_shibbi.jpg");
    const imgId = wb.addImage({ buffer: logoBuf, extension: "jpeg" });
    ws.addImage(imgId, {
      tl: { col: 0, row: 0 },
      ext: { width: 180, height: 30 },
    });
  } catch {
    /* sin logo no es fatal */
  }

  // Datos empresa (columna E)
  ws.getCell("E1").value = empresa_nombre;
  ws.getCell("E2").value = empresa_dir;
  ws.getCell("E3").value = empresa_ciudad;
  ws.getCell("E4").value = empresa_cif;

  // Nº y fecha
  ws.getCell("B3").value = pres.numero_presupuesto;
  const fechaMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(pres.fecha);
  if (fechaMatch) {
    const d = new Date(
      parseInt(fechaMatch[1]),
      parseInt(fechaMatch[2]) - 1,
      parseInt(fechaMatch[3])
    );
    ws.getCell("B4").value = d;
    ws.getCell("B4").numFmt = "dd/mm/yyyy";
  } else {
    ws.getCell("B4").value = pres.fecha || "";
  }

  // Cliente
  const cellB5 = ws.getCell("B5");
  cellB5.value = pres.cliente_nombre;
  cellB5.font = { bold: true, size: 12 };
  ws.getCell("B6").value = pres.cliente_direccion || "";
  ws.getCell("B7").value = pres.cliente_nif || "";
  ws.getCell("B8").value = "";

  // Limpiar filas 10-19 (cols 1, 5, 6, 7)
  for (let r = 10; r <= 19; r++) {
    for (const c of [1, 5, 6, 7]) {
      ws.getCell(r, c).value = null;
    }
  }

  // Cabeceras
  ws.getCell(9, 5).value = "Unidades";
  ws.getCell(9, 5).font = { bold: true, size: 10 };
  ws.getCell(9, 6).value = "PX";
  ws.getCell(9, 6).font = { bold: true, size: 10 };
  ws.getCell(9, 7).value = "Total";
  ws.getCell(9, 7).font = { bold: true, size: 10 };

  // Líneas
  const moneyFmt = '#,##0.00 €';
  const boldFont = { bold: true, size: 11 };
  const normalFont = { size: 11 };
  let row = 10;
  let totalBase = 0;
  for (const linea of pres.lineas) {
    const total = linea.precio_unitario_final * linea.cantidad;
    totalBase += total;

    ws.getCell(row, 1).value = linea.nombre_producto;
    ws.getCell(row, 1).font = boldFont as any;
    ws.getCell(row, 5).value = linea.cantidad;
    ws.getCell(row, 5).font = normalFont as any;
    ws.getCell(row, 6).value = linea.precio_unitario_final;
    ws.getCell(row, 6).font = normalFont as any;
    ws.getCell(row, 6).numFmt = moneyFmt;
    ws.getCell(row, 7).value = total;
    ws.getCell(row, 7).font = normalFont as any;
    ws.getCell(row, 7).numFmt = moneyFmt;
    row += 1;

    if (linea.descripcion) {
      for (const d of linea.descripcion.split("\n")) {
        if (d.trim() && row < 18) {
          ws.getCell(row, 1).value = d.trim();
          ws.getCell(row, 1).font = normalFont as any;
          row += 1;
        }
      }
    }
  }

  // Porte / Instalación
  ws.getCell(18, 1).value = textoPorteInstalacion(pres);
  ws.getCell(18, 1).font = boldFont as any;

  // Totales
  const iva = totalBase * (iva_pct / 100);
  const totalFinal = totalBase + iva;

  ws.getCell("D21").value = "Total Base";
  ws.getCell("G21").value = totalBase;
  ws.getCell("G21").numFmt = moneyFmt;

  ws.getCell("D22").value = `I.V.A ${iva_pct.toFixed(0)}%`;
  ws.getCell("G22").value = iva;
  ws.getCell("G22").numFmt = moneyFmt;

  ws.getCell("D23").value = "TOTAL";
  ws.getCell("D23").font = boldFont as any;
  ws.getCell("G23").value = totalFinal;
  ws.getCell("G23").numFmt = moneyFmt;
  ws.getCell("G23").font = boldFont as any;

  // Condiciones
  ws.getCell("A24").value = "CONDICIONES DE PAGO:";
  ws.getCell("A24").font = { bold: true, size: 12 } as any;
  ws.getCell("A25").value =
    pres.condiciones_pago ||
    "50% adelanto-50% antes de la entrega del trabajo.";
  ws.getCell("A25").font = { size: 12 } as any;
  ws.getCell("A26").value = `Los presupuestos caducan a los ${
    pres.dias_validez || 15
  } días`;
  ws.getCell("A26").font = { size: 12 } as any;
  ws.getCell("A27").value =
    `Pago mediante transferencia bancaria: CC: ${empresa_cuenta}`;
  ws.getCell("A27").font = { bold: true, size: 12 } as any;

  const out = await wb.xlsx.writeBuffer();
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
