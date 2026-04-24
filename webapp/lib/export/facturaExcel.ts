import ExcelJS from "exceljs";
import { ConfigMap, FacturaCarga, fetchAsset } from "./utils";

// Genera el Excel de factura usando PresupuestoPlantilla.xlsx como base.
// Réplica de factura_generator.generar_factura_excel.
export async function generarExcelFactura(
  factura: FacturaCarga,
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

  try {
    const logoBuf = await fetchAsset("/logo_shibbi.jpg");
    const imgId = wb.addImage({ buffer: logoBuf, extension: "jpeg" });
    ws.addImage(imgId, {
      tl: { col: 0, row: 0 },
      ext: { width: 180, height: 30 },
    });
  } catch {
    /* logo opcional */
  }

  ws.getCell("E1").value = empresa_nombre;
  ws.getCell("E2").value = empresa_dir;
  ws.getCell("E3").value = empresa_ciudad;
  ws.getCell("E4").value = empresa_cif;

  // Cabecera: cambiar PRESUPUESTO → FACTURA
  const a3 = ws.getCell("A3");
  a3.value = "FACTURA Nº:";
  a3.font = { bold: true, size: 12 } as any;
  const b3 = ws.getCell("B3");
  b3.value = factura.numero_factura;
  b3.font = { bold: true, size: 12 } as any;

  const fechaMatch = /^(\d{4})-(\d{2})-(\d{2})/.exec(factura.fecha);
  if (fechaMatch) {
    const d = new Date(
      parseInt(fechaMatch[1]),
      parseInt(fechaMatch[2]) - 1,
      parseInt(fechaMatch[3])
    );
    ws.getCell("B4").value = d;
    ws.getCell("B4").numFmt = "dd/mm/yyyy";
  } else {
    ws.getCell("B4").value = factura.fecha || "";
  }

  ws.getCell("B5").value = factura.cliente_nombre;
  ws.getCell("B5").font = { bold: true, size: 12 } as any;
  ws.getCell("B6").value = factura.cliente_direccion || "";
  ws.getCell("B7").value = factura.cliente_nif || "";
  ws.getCell("B8").value = "";

  // Limpiar filas 10-19 (cols 1, 5, 6, 7)
  for (let r = 10; r <= 19; r++) {
    for (const c of [1, 5, 6, 7]) ws.getCell(r, c).value = null;
  }

  // Cabeceras
  ws.getCell(9, 5).value = "Unidades";
  ws.getCell(9, 5).font = { bold: true, size: 10 } as any;
  ws.getCell(9, 6).value = "PX";
  ws.getCell(9, 6).font = { bold: true, size: 10 } as any;
  ws.getCell(9, 7).value = "Total";
  ws.getCell(9, 7).font = { bold: true, size: 10 } as any;

  const moneyFmt = "#,##0.00 €";
  const boldFont = { bold: true, size: 11 };
  const normalFont = { size: 11 };

  let row = 10;
  let totalBase = 0;
  for (const linea of factura.lineas) {
    const lineTotal = linea.unidades * linea.precio_unitario;
    totalBase += lineTotal;
    const concepto = linea.es_porte ? `(Porte) ${linea.concepto}` : linea.concepto;

    ws.getCell(row, 1).value = concepto;
    ws.getCell(row, 1).font = boldFont as any;
    ws.getCell(row, 5).value = linea.unidades;
    ws.getCell(row, 5).font = normalFont as any;
    ws.getCell(row, 6).value = linea.precio_unitario;
    ws.getCell(row, 6).font = normalFont as any;
    ws.getCell(row, 6).numFmt = moneyFmt;
    ws.getCell(row, 7).value = lineTotal;
    ws.getCell(row, 7).font = normalFont as any;
    ws.getCell(row, 7).numFmt = moneyFmt;
    row += 1;
    if (row >= 18) break;
  }

  // Adelanto (rojo, negativo)
  const adelanto = factura.adelanto_importe || 0;
  if (adelanto > 0 && row < 18) {
    const desc = factura.adelanto_descripcion || "Adelanto 50%";
    ws.getCell(row, 1).value = desc;
    ws.getCell(row, 1).font = boldFont as any;
    ws.getCell(row, 7).value = -adelanto;
    ws.getCell(row, 7).font = {
      bold: true,
      size: 11,
      color: { argb: "FFFF0000" },
    } as any;
    ws.getCell(row, 7).numFmt = moneyFmt;
    totalBase -= adelanto;
    row += 1;
  }

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

  // Limpiar condiciones + línea banco duplicada
  for (let r = 24; r <= 27; r++) ws.getCell(r, 1).value = null;
  ws.getCell("A24").value = `Pago mediante transferencia bancaria: CC: ${empresa_cuenta}`;
  ws.getCell("A24").font = { bold: true, size: 12 } as any;

  const out = await wb.xlsx.writeBuffer();
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
