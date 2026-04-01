import os
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, Paragraph
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER


def generar_pdf_presupuesto(app, presupuesto_id):
    """Generate a professional PDF budget for the client (no cost breakdown)."""
    pres = app.presupuesto_model.obtener(presupuesto_id)
    if not pres:
        return None

    # Config values
    empresa_nombre = app.config_model.obtener("empresa_nombre") or "CAESPAN ARGUMENT S.L."
    empresa_dir = app.config_model.obtener("empresa_direccion") or ""
    empresa_ciudad = app.config_model.obtener("empresa_ciudad") or ""
    empresa_cif = app.config_model.obtener("empresa_cif") or ""
    empresa_cuenta = app.config_model.obtener("empresa_cuenta_bancaria") or ""
    iva_pct = app.config_model.obtener_float("iva_porcentaje", 21)

    # Save in client folder
    base_output = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                                "output")
    safe_name = "".join(c if c.isalnum() or c in (" ", "-", "_") else "_"
                        for c in pres["cliente_nombre"]).strip()
    output_dir = os.path.join(base_output, safe_name)
    os.makedirs(output_dir, exist_ok=True)
    filename = f"Presupuesto_{pres['numero_presupuesto']}.pdf"
    filepath = os.path.join(output_dir, filename)

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=20 * mm, rightMargin=20 * mm,
        topMargin=15 * mm, bottomMargin=15 * mm
    )

    styles = getSampleStyleSheet()
    elements = []

    # Colors
    dark = HexColor("#1a1a2e")
    accent = HexColor("#e94560")
    light_gray = HexColor("#f0f2f5")
    white = HexColor("#ffffff")
    text_color = HexColor("#333333")

    # Custom styles
    title_style = ParagraphStyle(
        "CustomTitle", parent=styles["Normal"],
        fontSize=22, textColor=accent, fontName="Helvetica-Bold",
        spaceAfter=2 * mm
    )
    company_style = ParagraphStyle(
        "Company", parent=styles["Normal"],
        fontSize=10, textColor=text_color, fontName="Helvetica",
        leading=14
    )
    label_style = ParagraphStyle(
        "Label", parent=styles["Normal"],
        fontSize=10, textColor=HexColor("#666666"), fontName="Helvetica",
    )
    value_style = ParagraphStyle(
        "Value", parent=styles["Normal"],
        fontSize=11, textColor=text_color, fontName="Helvetica-Bold",
    )
    small_style = ParagraphStyle(
        "Small", parent=styles["Normal"],
        fontSize=9, textColor=HexColor("#888888"), fontName="Helvetica",
        leading=12
    )

    # --- Header: Company info + Budget number ---
    header_data = [
        [
            Paragraph(f"PRESUPUESTO Nº: {pres['numero_presupuesto']}", title_style),
            Paragraph(
                f"<b>{empresa_nombre}</b><br/>{empresa_dir}<br/>{empresa_ciudad}<br/>{empresa_cif}",
                company_style
            ),
        ]
    ]

    header_table = Table(header_data, colWidths=[95 * mm, 75 * mm])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 8 * mm))

    # --- Client info ---
    try:
        fecha_obj = datetime.strptime(pres["fecha"], "%Y-%m-%d")
        fecha_str = fecha_obj.strftime("%d/%m/%Y")
    except (ValueError, TypeError):
        fecha_str = pres["fecha"] or ""

    client_data = [
        [Paragraph("FECHA:", label_style), Paragraph(fecha_str, value_style),
         Paragraph("CLIENTE:", label_style), Paragraph(pres["cliente_nombre"], value_style)],
        [Paragraph("", label_style), Paragraph("", value_style),
         Paragraph("DIRECCIÓN:", label_style),
         Paragraph(pres["cliente_direccion"] or "", company_style)],
        [Paragraph("", label_style), Paragraph("", value_style),
         Paragraph("C.I.F./N.I.F:", label_style),
         Paragraph(pres["cliente_nif"] or "", company_style)],
    ]

    client_table = Table(client_data, colWidths=[22 * mm, 55 * mm, 27 * mm, 66 * mm])
    client_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
    ]))
    elements.append(client_table)
    elements.append(Spacer(1, 10 * mm))

    # --- Products table ---
    lineas = app.presupuesto_model.obtener_lineas(presupuesto_id)

    # Header row
    product_data = [
        [
            Paragraph("<b>Concepto</b>", ParagraphStyle("", parent=styles["Normal"],
                      fontSize=10, textColor=white, fontName="Helvetica-Bold")),
            Paragraph("<b>Importe</b>", ParagraphStyle("", parent=styles["Normal"],
                      fontSize=10, textColor=white, fontName="Helvetica-Bold",
                      alignment=TA_RIGHT)),
        ]
    ]

    total_base = 0
    for linea in lineas:
        precio_total = linea["precio_unitario_final"] * linea["cantidad"]
        total_base += precio_total

        # Build description
        desc_parts = [linea["nombre_producto"]]
        if linea["descripcion"]:
            desc_parts.append(linea["descripcion"])
        if linea["cantidad"] > 1:
            desc_parts.append(f"({linea['cantidad']} unidades)")

        desc_text = "<br/>".join(desc_parts)

        product_data.append([
            Paragraph(desc_text, ParagraphStyle("", parent=styles["Normal"],
                      fontSize=10, textColor=text_color, fontName="Helvetica",
                      leading=14)),
            Paragraph(f"{precio_total:,.2f}€", ParagraphStyle("", parent=styles["Normal"],
                      fontSize=11, textColor=text_color, fontName="Helvetica-Bold",
                      alignment=TA_RIGHT)),
        ])

    # Empty rows for spacing (like the original template)
    for _ in range(max(0, 8 - len(lineas))):
        product_data.append(["", ""])

    product_table = Table(product_data, colWidths=[130 * mm, 40 * mm])
    product_table.setStyle(TableStyle([
        # Header
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        # Body
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 1), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.5, HexColor("#e0e0e0")),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        # Border
        ("BOX", (0, 0), (-1, -1), 0.5, HexColor("#cccccc")),
    ]))
    elements.append(product_table)

    # Installation note
    if not pres["incluye_instalacion"]:
        elements.append(Spacer(1, 3 * mm))
        elements.append(Paragraph("Porte No incluido", small_style))

    elements.append(Spacer(1, 8 * mm))

    # --- Totals ---
    iva = total_base * (iva_pct / 100)
    total_final = total_base + iva

    totals_data = [
        ["Total Base", f"{total_base:,.2f}€"],
        [f"I.V.A {iva_pct:.0f}%", f"{iva:,.2f}€"],
        ["TOTAL", f"{total_final:,.2f}€"],
    ]

    totals_table = Table(totals_data, colWidths=[30 * mm, 40 * mm])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 11),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LINEBELOW", (0, 1), (-1, 1), 0.5, HexColor("#cccccc")),
        # Total row bold
        ("FONTNAME", (0, 2), (-1, 2), "Helvetica-Bold"),
        ("FONTSIZE", (0, 2), (-1, 2), 13),
        ("TEXTCOLOR", (1, 2), (1, 2), accent),
    ]))

    # Wrap totals to the right
    totals_wrapper = Table([[None, totals_table]], colWidths=[100 * mm, 70 * mm])
    totals_wrapper.setStyle(TableStyle([
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))
    elements.append(totals_wrapper)
    elements.append(Spacer(1, 12 * mm))

    # --- Payment conditions ---
    cond_style = ParagraphStyle(
        "Conditions", parent=styles["Normal"],
        fontSize=9, textColor=HexColor("#555555"), fontName="Helvetica",
        leading=13
    )
    cond_bold = ParagraphStyle(
        "CondBold", parent=styles["Normal"],
        fontSize=9, textColor=text_color, fontName="Helvetica-Bold",
        leading=13
    )

    elements.append(Paragraph("CONDICIONES DE PAGO:", cond_bold))
    elements.append(Paragraph(pres["condiciones_pago"] or "", cond_style))
    elements.append(Spacer(1, 3 * mm))

    # Validity
    try:
        fecha_obj = datetime.strptime(pres["fecha"], "%Y-%m-%d")
        fecha_caduc = fecha_obj + timedelta(days=pres["dias_validez"] or 15)
        elements.append(Paragraph(
            f"Los presupuestos caducan a los {pres['dias_validez']} días ({fecha_caduc.strftime('%d/%m/%Y')})",
            cond_style
        ))
    except (ValueError, TypeError):
        elements.append(Paragraph(
            f"Los presupuestos caducan a los {pres['dias_validez'] or 15} días", cond_style
        ))

    elements.append(Spacer(1, 3 * mm))
    elements.append(Paragraph(
        f"Pago mediante transferencia bancaria: CC: {empresa_cuenta}", cond_style
    ))

    doc.build(elements)
    return filepath
