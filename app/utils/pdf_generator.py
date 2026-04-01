import os
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import HexColor, Color
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER
from reportlab.pdfgen import canvas


def generar_pdf_presupuesto(app, presupuesto_id):
    """Generate PDF matching the original company template (PresupuestoPlantilla.xlsx)."""
    pres = app.presupuesto_model.obtener(presupuesto_id)
    if not pres:
        return None

    empresa_nombre = app.config_model.obtener("empresa_nombre") or "CAESPAN ARGUMENT S.L."
    empresa_dir = app.config_model.obtener("empresa_direccion") or ""
    empresa_ciudad = app.config_model.obtener("empresa_ciudad") or ""
    empresa_cif = app.config_model.obtener("empresa_cif") or ""
    empresa_cuenta = app.config_model.obtener("empresa_cuenta_bancaria") or ""
    iva_pct = app.config_model.obtener_float("iva_porcentaje", 21)

    # Output path
    base_output = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "output")
    safe_name = "".join(c if c.isalnum() or c in (" ", "-", "_") else "_"
                        for c in pres["cliente_nombre"]).strip()
    output_dir = os.path.join(base_output, safe_name)
    os.makedirs(output_dir, exist_ok=True)
    filename = f"Presupuesto_{pres['numero_presupuesto']}_{safe_name}.pdf"
    filepath = os.path.join(output_dir, filename)

    # Colors matching original template
    logo_color = HexColor("#7FAEAB")  # Teal/sage color from SHIBBI logo
    text_dark = HexColor("#333333")
    text_gray = HexColor("#666666")
    line_color = HexColor("#CCCCCC")

    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            leftMargin=15 * mm, rightMargin=15 * mm,
                            topMargin=10 * mm, bottomMargin=15 * mm)

    styles = getSampleStyleSheet()
    elements = []

    # --- LOGO: "SHIBBI" text in the teal/sage color ---
    logo_style = ParagraphStyle("Logo", parent=styles["Normal"],
                                 fontSize=36, fontName="Helvetica-Bold",
                                 textColor=logo_color, leading=40, spaceAfter=2 * mm)
    elements.append(Paragraph("SHIBBI", logo_style))
    elements.append(Spacer(1, 3 * mm))

    # --- Company info (right side) + Budget info (left side) ---
    info_label = ParagraphStyle("InfoLabel", parent=styles["Normal"],
                                 fontSize=10, fontName="Helvetica", textColor=text_dark)
    info_bold = ParagraphStyle("InfoBold", parent=styles["Normal"],
                                fontSize=10, fontName="Helvetica-Bold", textColor=text_dark)
    info_company = ParagraphStyle("InfoCompany", parent=styles["Normal"],
                                   fontSize=10, fontName="Helvetica-Bold", textColor=text_dark,
                                   alignment=TA_RIGHT, leading=14)

    try:
        fecha_str = datetime.strptime(pres["fecha"], "%Y-%m-%d").strftime("%d/%m/%Y")
    except (ValueError, TypeError):
        fecha_str = pres["fecha"] or ""

    header_data = [
        [Paragraph(f"<b>PRESUPUESTO  Nº:</b>  {pres['numero_presupuesto']}", info_bold),
         Paragraph(f"{empresa_nombre}<br/>{empresa_dir}<br/>{empresa_ciudad}<br/>{empresa_cif}", info_company)],
    ]
    ht = Table(header_data, colWidths=[95 * mm, 85 * mm])
    ht.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(ht)
    elements.append(Spacer(1, 3 * mm))

    # Client details
    client_data = [
        [Paragraph("FECHA:", info_label), Paragraph(fecha_str, info_label),
         "", ""],
        [Paragraph("CLIENTE:", info_label), Paragraph(f"<b>{pres['cliente_nombre']}</b>", info_bold),
         "", ""],
        [Paragraph("DIRECCIÓN:", info_label), Paragraph(pres["cliente_direccion"] or "", info_label),
         "", ""],
        [Paragraph("C.I.F./N.I.F:", info_label), Paragraph(pres["cliente_nif"] or "", info_label),
         "", ""],
    ]
    ct = Table(client_data, colWidths=[25 * mm, 70 * mm, 40 * mm, 45 * mm])
    ct.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
    ]))
    elements.append(ct)
    elements.append(Spacer(1, 8 * mm))

    # --- Products table ---
    lineas = app.presupuesto_model.obtener_lineas(presupuesto_id)

    # Header row
    col_header_style = ParagraphStyle("ColH", parent=styles["Normal"],
                                       fontSize=10, fontName="Helvetica-Bold",
                                       textColor=text_dark, alignment=TA_RIGHT)
    product_data = [["", Paragraph("<b>Base</b>", col_header_style)]]

    total_base = 0
    product_style = ParagraphStyle("Prod", parent=styles["Normal"],
                                    fontSize=10, fontName="Helvetica-Bold", textColor=text_dark)
    desc_style = ParagraphStyle("Desc", parent=styles["Normal"],
                                 fontSize=10, fontName="Helvetica", textColor=text_dark)
    price_style = ParagraphStyle("Price", parent=styles["Normal"],
                                  fontSize=10, fontName="Helvetica", textColor=text_dark,
                                  alignment=TA_RIGHT)

    for linea in lineas:
        precio_total = linea["precio_unitario_final"] * linea["cantidad"]
        total_base += precio_total

        # Product name row
        product_data.append([
            Paragraph(linea["nombre_producto"], product_style),
            Paragraph(f"{precio_total:,.2f} €", price_style)
        ])

        # Description lines below product name
        if linea["descripcion"]:
            for desc_line in linea["descripcion"].split("\n"):
                if desc_line.strip():
                    product_data.append([Paragraph(desc_line.strip(), desc_style), ""])

        # Quantity if > 1
        if linea["cantidad"] > 1:
            product_data.append([Paragraph(f"({linea['cantidad']} unidades)", desc_style), ""])

    # Empty rows for spacing (like original template)
    for _ in range(max(0, 6 - len(lineas))):
        product_data.append(["", ""])

    # Porte note
    porte_style = ParagraphStyle("Porte", parent=styles["Normal"],
                                  fontSize=10, fontName="Helvetica-Bold", textColor=text_dark)
    if not pres["incluye_instalacion"]:
        product_data.append([Paragraph("Porte No incluido", porte_style), ""])
    else:
        product_data.append([Paragraph("Porte e instalación incluidos", porte_style), ""])

    pt = Table(product_data, colWidths=[140 * mm, 40 * mm])
    pt.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEBELOW", (0, 0), (-1, 0), 0.5, line_color),
    ]))
    elements.append(pt)
    elements.append(Spacer(1, 8 * mm))

    # --- Totals ---
    iva = total_base * (iva_pct / 100)
    total_final = total_base + iva

    total_label = ParagraphStyle("TL", parent=styles["Normal"],
                                  fontSize=11, fontName="Helvetica", textColor=text_dark,
                                  alignment=TA_RIGHT)
    total_value = ParagraphStyle("TV", parent=styles["Normal"],
                                  fontSize=11, fontName="Helvetica", textColor=text_dark,
                                  alignment=TA_RIGHT)
    total_bold_label = ParagraphStyle("TBL", parent=styles["Normal"],
                                       fontSize=12, fontName="Helvetica-Bold", textColor=text_dark,
                                       alignment=TA_RIGHT)
    total_bold_value = ParagraphStyle("TBV", parent=styles["Normal"],
                                       fontSize=12, fontName="Helvetica-Bold", textColor=text_dark,
                                       alignment=TA_RIGHT)

    totals_data = [
        [Paragraph("Total Base", total_label), Paragraph(f"{total_base:,.2f} €", total_value)],
        [Paragraph(f"I.V.A {iva_pct:.0f}%", total_label), Paragraph(f"{iva:,.2f} €", total_value)],
        [Paragraph("TOTAL", total_bold_label), Paragraph(f"{total_final:,.2f} €", total_bold_value)],
    ]
    tt = Table(totals_data, colWidths=[35 * mm, 40 * mm])
    tt.setStyle(TableStyle([
        ("ALIGN", (0, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LINEABOVE", (0, 2), (-1, 2), 1, text_dark),
    ]))

    # Align totals to the right
    tw = Table([[None, tt]], colWidths=[105 * mm, 75 * mm])
    tw.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(tw)
    elements.append(Spacer(1, 12 * mm))

    # --- Payment conditions ---
    cond_bold = ParagraphStyle("CB", parent=styles["Normal"],
                                fontSize=11, fontName="Helvetica-Bold", textColor=text_dark, leading=16)
    cond_normal = ParagraphStyle("CN", parent=styles["Normal"],
                                  fontSize=11, fontName="Helvetica", textColor=text_dark, leading=16)

    elements.append(Paragraph("CONDICIONES DE PAGO:", cond_bold))
    elements.append(Paragraph(
        pres["condiciones_pago"] or "50% adelanto-50% antes de la entrega del trabajo.", cond_normal))

    try:
        dias = pres["dias_validez"] or 15
        elements.append(Paragraph(f"Los presupuestos caducan a los {dias} días", cond_normal))
    except (ValueError, TypeError):
        elements.append(Paragraph("Los presupuestos caducan a los 15 días", cond_normal))

    elements.append(Paragraph(
        f"<b>Pago mediante transferencia bancaria: CC: {empresa_cuenta}</b>", cond_bold))

    doc.build(elements)
    return filepath
