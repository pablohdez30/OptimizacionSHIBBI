import ExcelJS from "exceljs";
import { ConfigMap, PresupuestoCarga } from "./utils";

// Replica excel_generator.py — Excel interno con desglose de costes por línea.
export async function generarExcelDesglose(
  pres: PresupuestoCarga,
  config: ConfigMap
): Promise<Blob> {
  const iva_pct = parseFloat(config.iva_porcentaje || "21");

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Desglose Costes");

  // Anchos de columna
  const widths = [20, 18, 30, 10, 14, 14, 14];
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));

  const moneyFmt = "#,##0.00€";

  const headerFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 14,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  const headerFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1A1A2E" },
  };
  const subheaderFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FFFFFFFF" },
  };
  const subheaderFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE94560" },
  };
  const boldFont: Partial<ExcelJS.Font> = {
    name: "Calibri",
    size: 11,
    bold: true,
  };
  const normalFont: Partial<ExcelJS.Font> = { name: "Calibri", size: 11 };
  const thinBorder: Partial<ExcelJS.Borders> = {
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
  };
  const lightFill: ExcelJS.Fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF8F9FA" },
  };

  let row = 1;

  // Title
  ws.mergeCells(row, 1, row, 7);
  const titleCell = ws.getCell(row, 1);
  titleCell.value = `DESGLOSE DE COSTES - ${pres.numero_presupuesto}`;
  titleCell.font = headerFont as any;
  titleCell.fill = headerFill;
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(row).height = 30;
  row += 1;

  // Cliente / fecha
  ws.getCell(row, 1).value = "Cliente:";
  ws.getCell(row, 1).font = boldFont as any;
  ws.getCell(row, 2).value = pres.cliente_nombre;
  ws.getCell(row, 2).font = normalFont as any;
  ws.getCell(row, 4).value = "Fecha:";
  ws.getCell(row, 4).font = boldFont as any;
  ws.getCell(row, 5).value = pres.fecha;
  ws.getCell(row, 5).font = normalFont as any;
  row += 2;

  let granTotalCoste = 0;
  let granTotalCliente = 0;

  for (const linea of pres.lineas) {
    // Header producto
    ws.mergeCells(row, 1, row, 7);
    const subCell = ws.getCell(row, 1);
    subCell.value = `${linea.nombre_producto} — ${linea.descripcion}`;
    subCell.font = subheaderFont as any;
    subCell.fill = subheaderFill;
    subCell.alignment = { horizontal: "left", vertical: "middle" };
    ws.getRow(row).height = 25;
    row += 1;

    const headers = [
      "Categoría",
      "Proveedor",
      "Descripción",
      "Cantidad",
      "Precio Ud.",
      "Total",
    ];
    headers.forEach((h, i) => {
      const c = ws.getCell(row, i + 1);
      c.value = h;
      c.font = {
        name: "Calibri",
        size: 10,
        bold: true,
        color: { argb: "FF666666" },
      } as any;
      c.fill = lightFill;
      c.border = thinBorder;
    });
    row += 1;

    let costeLinea = 0;
    for (const det of linea.detalles) {
      ws.getCell(row, 1).value = det.categoria_nombre;
      ws.getCell(row, 1).font = normalFont as any;
      ws.getCell(row, 2).value = det.proveedor_nombre;
      ws.getCell(row, 2).font = normalFont as any;
      ws.getCell(row, 3).value = det.descripcion;
      ws.getCell(row, 3).font = normalFont as any;
      ws.getCell(row, 4).value = det.cantidad;
      ws.getCell(row, 4).font = normalFont as any;
      ws.getCell(row, 5).value = det.precio_unitario;
      ws.getCell(row, 5).font = normalFont as any;
      ws.getCell(row, 5).numFmt = moneyFmt;
      ws.getCell(row, 6).value = det.precio_total;
      ws.getCell(row, 6).font = normalFont as any;
      ws.getCell(row, 6).numFmt = moneyFmt;

      for (let c = 1; c <= 6; c++) {
        ws.getCell(row, c).border = thinBorder;
      }
      costeLinea += det.precio_total;
      row += 1;
    }

    // Totales de línea
    ws.getCell(row, 4).value = "COSTE:";
    ws.getCell(row, 4).font = boldFont as any;
    ws.getCell(row, 6).value = costeLinea;
    ws.getCell(row, 6).font = boldFont as any;
    ws.getCell(row, 6).numFmt = moneyFmt;
    row += 1;

    ws.getCell(row, 4).value = `Margen ${linea.margen_porcentaje.toFixed(0)}%:`;
    ws.getCell(row, 4).font = boldFont as any;
    ws.getCell(row, 6).value = linea.precio_unitario_final;
    ws.getCell(row, 6).font = boldFont as any;
    ws.getCell(row, 6).numFmt = moneyFmt;
    ws.getCell(row, 7).value = `x${linea.cantidad}`;
    ws.getCell(row, 7).font = normalFont as any;
    row += 1;

    granTotalCoste += costeLinea * linea.cantidad;
    granTotalCliente += linea.precio_unitario_final * linea.cantidad;
    row += 1;
  }

  // Totales globales
  row += 1;
  ws.getCell(row, 4).value = "COSTE TOTAL:";
  ws.getCell(row, 4).font = boldFont as any;
  ws.getCell(row, 6).value = granTotalCoste;
  ws.getCell(row, 6).font = boldFont as any;
  ws.getCell(row, 6).numFmt = moneyFmt;
  row += 1;

  ws.getCell(row, 4).value = "PRECIO CLIENTE:";
  ws.getCell(row, 4).font = boldFont as any;
  ws.getCell(row, 6).value = granTotalCliente;
  ws.getCell(row, 6).font = {
    name: "Calibri",
    size: 12,
    bold: true,
    color: { argb: "FFE94560" },
  } as any;
  ws.getCell(row, 6).numFmt = moneyFmt;
  row += 1;

  const iva = granTotalCliente * (iva_pct / 100);
  ws.getCell(row, 4).value = `IVA ${iva_pct.toFixed(0)}%:`;
  ws.getCell(row, 4).font = boldFont as any;
  ws.getCell(row, 6).value = iva;
  ws.getCell(row, 6).font = boldFont as any;
  ws.getCell(row, 6).numFmt = moneyFmt;
  row += 1;

  const totalFinal = granTotalCliente + iva;
  ws.getCell(row, 4).value = "TOTAL CON IVA:";
  ws.getCell(row, 4).font = { name: "Calibri", size: 13, bold: true } as any;
  ws.getCell(row, 6).value = totalFinal;
  ws.getCell(row, 6).font = {
    name: "Calibri",
    size: 13,
    bold: true,
    color: { argb: "FFE94560" },
  } as any;
  ws.getCell(row, 6).numFmt = moneyFmt;
  row += 1;

  const beneficio = granTotalCliente - granTotalCoste;
  ws.getCell(row, 4).value = "BENEFICIO:";
  ws.getCell(row, 4).font = boldFont as any;
  ws.getCell(row, 6).value = beneficio;
  ws.getCell(row, 6).font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF2D6A4F" },
  } as any;
  ws.getCell(row, 6).numFmt = moneyFmt;

  const out = await wb.xlsx.writeBuffer();
  return new Blob([out], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
