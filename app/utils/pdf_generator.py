import os
from datetime import datetime, timedelta
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Spacer, Paragraph, Image
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_RIGHT


def generar_pdf_presupuesto(app, presupuesto_id):
    """Generate PDF matching the original company template exactly."""
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
    from app.utils.output_path import get_output_path
    filepath = get_output_path("PRESUPUESTOS", pres["numero_presupuesto"],
                               pres["cliente_nombre"], "pdf", app=app)

    # Colors
    black = HexColor("#000000")
    border_color = HexColor("#000000")

    # Styles
    s_normal = ParagraphStyle("N", fontSize=11, fontName="Helvetica", textColor=black, leading=14)
    s_bold = ParagraphStyle("B", fontSize=11, fontName="Helvetica-Bold", textColor=black, leading=14)
    s_bold12 = ParagraphStyle("B12", fontSize=12, fontName="Helvetica-Bold", textColor=black, leading=15)
    s_right = ParagraphStyle("R", fontSize=11, fontName="Helvetica", textColor=black, alignment=TA_RIGHT, leading=14)
    s_right_bold = ParagraphStyle("RB", fontSize=11, fontName="Helvetica-Bold", textColor=black, alignment=TA_RIGHT, leading=14)
    s_company = ParagraphStyle("C", fontSize=11, fontName="Helvetica-Bold", textColor=black, alignment=TA_RIGHT, leading=15)

    doc = SimpleDocTemplate(filepath, pagesize=A4,
                            leftMargin=20 * mm, rightMargin=20 * mm,
                            topMargin=15 * mm, bottomMargin=15 * mm)
    elements = []

    # --- LOGO IMAGE ---
    logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                              "assets", "logo_shibbi.jpg")
    if os.path.exists(logo_path):
        logo = Image(logo_path, width=50 * mm, height=14 * mm)
        # Logo left + Company info right
        header_data = [[logo, Paragraph(
            f"{empresa_nombre}<br/>{empresa_dir}<br/>{empresa_ciudad}<br/>{empresa_cif}",
            s_company)]]
    else:
        # Fallback text logo
        s_logo = ParagraphStyle("Logo", fontSize=32, fontName="Helvetica-Bold",
                                 textColor=HexColor("#7FAEAB"), leading=36)
        header_data = [[Paragraph("SHIBBI", s_logo), Paragraph(
            f"{empresa_nombre}<br/>{empresa_dir}<br/>{empresa_ciudad}<br/>{empresa_cif}",
            s_company)]]

    ht = Table(header_data, colWidths=[90 * mm, 80 * mm])
    ht.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
    ]))
    elements.append(ht)

    # --- Budget info + Client info ---
    try:
        fecha_str = datetime.strptime(pres["fecha"], "%Y-%m-%d").strftime("%d/%m/%Y")
    except (ValueError, TypeError):
        fecha_str = pres["fecha"] or ""

    info_data = [
        [Paragraph("<b>PRESUPUESTO  Nº:</b>", s_bold), Paragraph(pres["numero_presupuesto"], s_bold), "", ""],
        [Paragraph("FECHA:", s_normal), Paragraph(fecha_str, s_normal), "", ""],
        [Paragraph("CLIENTE:", s_normal), Paragraph(f"<b>{pres['cliente_nombre']}</b>", s_bold12), "", ""],
        [Paragraph("DIRECCIÓN:", s_normal), Paragraph(pres["cliente_direccion"] or "", s_normal), "", ""],
        [Paragraph("C.I.F./N.I.F:", s_normal), "", "", ""],
        ["", Paragraph(pres["cliente_nif"] or "", s_normal), "", ""],
    ]

    it = Table(info_data, colWidths=[35 * mm, 55 * mm, 40 * mm, 40 * mm])
    it.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 1),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
        ("LINEBELOW", (0, 0), (1, 0), 1, border_color),
    ]))
    elements.append(it)
    elements.append(Spacer(1, 8 * mm))

    # --- Black bar + "Base" header ---
    bar_data = [["", Paragraph("<b>Base</b>", s_right_bold)]]
    bt = Table(bar_data, colWidths=[135 * mm, 35 * mm])
    bt.setStyle(TableStyle([
        ("LINEABOVE", (0, 0), (-1, 0), 2, border_color),
        ("TOPPADDING", (0, 0), (-1, 0), 4),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 4),
    ]))
    elements.append(bt)

    # --- Products ---
    lineas = app.presupuesto_model.obtener_lineas(presupuesto_id)
    total_base = 0

    for linea in lineas:
        precio_total = linea["precio_unitario_final"] * linea["cantidad"]
        total_base += precio_total

        # Product name + price
        prod_row = [[Paragraph(f"<b>{linea['nombre_producto']}</b>", s_bold),
                     Paragraph(f"€ {precio_total:,.2f}", s_right)]]
        pt = Table(prod_row, colWidths=[135 * mm, 35 * mm])
        pt.setStyle(TableStyle([
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, 0), 3),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
        ]))
        elements.append(pt)

        # Description lines
        if linea["descripcion"]:
            for desc_line in linea["descripcion"].split("\n"):
                if desc_line.strip():
                    elements.append(Paragraph(desc_line.strip(), s_normal))

        if linea["cantidad"] > 1:
            elements.append(Paragraph(f"({linea['cantidad']} unidades)", s_normal))

        elements.append(Spacer(1, 2 * mm))

    # Spacing to push porte note down
    elements.append(Spacer(1, 10 * mm))

    # Porte note
    if not pres["incluye_instalacion"]:
        elements.append(Paragraph("<b>Porte No incluido</b>", s_bold))
    else:
        elements.append(Paragraph("<b>Porte e instalación incluidos</b>", s_bold))

    elements.append(Spacer(1, 10 * mm))

    # --- Totals box (with border like original) ---
    iva = total_base * (iva_pct / 100)
    total_final = total_base + iva

    totals_data = [
        [Paragraph("Total Base", s_normal), Paragraph(f"{total_base:,.2f} €", s_right)],
        [Paragraph(f"I.V.A {iva_pct:.0f}%", s_normal), Paragraph(f"{iva:,.2f} €", s_right)],
        [Paragraph("<b>TOTAL</b>", s_bold), Paragraph(f"<b>{total_final:,.2f} €</b>", s_right_bold)],
    ]
    tt = Table(totals_data, colWidths=[40 * mm, 40 * mm])
    tt.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("LINEABOVE", (0, 2), (-1, 2), 0.5, border_color),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))

    # Align totals to the right
    tw = Table([[None, tt]], colWidths=[90 * mm, 80 * mm])
    tw.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(tw)
    elements.append(Spacer(1, 5 * mm))

    # --- Payment conditions (with border box like original) ---
    cond_text = pres["condiciones_pago"] or "50% adelanto-50% antes de la entrega del trabajo."
    dias = pres["dias_validez"] or 15

    cond_data = [
        [Paragraph("<b>CONDICIONES DE PAGO:</b>", s_bold)],
        [Paragraph(cond_text, s_normal)],
        [Paragraph(f"Los presupuestos caducan a los {dias} días", s_normal)],
    ]
    ct = Table(cond_data, colWidths=[170 * mm])
    ct.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 1, border_color),
        ("TOPPADDING", (0, 0), (-1, -1), 2),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(ct)

    # Bank transfer line (bold, outside box like original)
    elements.append(Paragraph(
        f"<b>Pago mediante transferencia bancaria: CC: {empresa_cuenta}</b>", s_bold))

    doc.build(elements)
    return filepath
