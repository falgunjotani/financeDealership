from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUTPUT_FILE = "AutoFinance_IIS_Deployment_Runbook.pdf"


def section_heading(text):
    return Paragraph(text, STYLES["section"])


def body(text):
    return Paragraph(text, STYLES["body"])


STYLESHEET = getSampleStyleSheet()
STYLES = {
    "title": ParagraphStyle(
        "title",
        parent=STYLESHEET["Title"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        spaceAfter=8,
    ),
    "meta": ParagraphStyle(
        "meta",
        parent=STYLESHEET["Normal"],
        fontName="Helvetica",
        fontSize=9,
        textColor=colors.HexColor("#444444"),
        leading=12,
        spaceAfter=2,
    ),
    "section": ParagraphStyle(
        "section",
        parent=STYLESHEET["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        spaceBefore=10,
        spaceAfter=5,
    ),
    "body": ParagraphStyle(
        "body",
        parent=STYLESHEET["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        spaceAfter=4,
    ),
}


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT_FILE,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )

    story = []
    story.append(Paragraph("AutoFinance IIS Deployment Runbook", STYLES["title"]))
    story.append(Paragraph("Team Confluence-style (with Severity / Owner / Escalation)", STYLES["meta"]))
    story.append(Paragraph("Last Updated: 2026-05-06", STYLES["meta"]))
    story.append(Spacer(1, 4))

    story.append(section_heading("1. Purpose"))
    story.append(
        body(
            "This runbook captures deployment and runtime issues encountered while deploying "
            "AutoFinance F&I on IIS, with triage ownership and escalation paths."
        )
    )

    story.append(section_heading("2. Severity Model"))
    severity_data = [
        ["Severity", "Definition"],
        ["SEV-1", "Critical outage; deal workflow unavailable for all users."],
        ["SEV-2", "High impact; major functionality broken with limited workaround."],
        ["SEV-3", "Partial degradation; workaround exists."],
        ["SEV-4", "Low impact; non-blocking or cosmetic issue."],
    ]
    severity_tbl = Table(severity_data, colWidths=[28 * mm, 130 * mm])
    severity_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EEF8")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1F2937")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(severity_tbl)

    story.append(section_heading("3. Ownership and Escalation"))
    ownership_data = [
        ["Area", "Primary Owner", "Secondary Owner", "Escalation Path"],
        ["IIS Infrastructure", "Infra/Windows Admin", "DevOps Engineer", "Service Desk -> Infra On-Call -> Platform Lead"],
        ["App Build/Release", "Frontend Engineer", "Release Engineer", "FE On-Call -> Tech Lead -> Eng Manager"],
        ["Firebase Config/Data", "App Engineer", "Cloud Engineer", "FE On-Call -> Firebase Owner -> Platform Lead"],
    ]
    ownership_tbl = Table(ownership_data, colWidths=[35 * mm, 35 * mm, 35 * mm, 63 * mm])
    ownership_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EEF8")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(ownership_tbl)

    story.append(section_heading("4. Incident Runbook Entries"))
    story.append(body("<b>INC-001: Duplicate MIME map (.woff2)</b>"))
    story.append(body("Severity: SEV-2 | Owner: IIS Infrastructure / DevOps"))
    story.append(body("Error: Cannot add duplicate collection entry of type 'mimeMap' for '.woff2'."))
    story.append(body("Root Cause: IIS already defines the extension at inherited/global level."))
    story.append(body("Fix: In web.config, use remove then add inside staticContent for .woff2 and .webmanifest."))
    story.append(body("Validate: Rebuild, redeploy dist, and confirm site loads without MIME errors."))

    story.append(body("<b>INC-002: Duplicate default document (index.html)</b>"))
    story.append(body("Severity: SEV-2 | Owner: IIS Infrastructure / DevOps"))
    story.append(body("Error: Cannot add duplicate collection entry of type 'add' for 'index.html'."))
    story.append(body("Root Cause: index.html already inherited in IIS default document list."))
    story.append(body("Fix: In web.config defaultDocument/files, use remove then add for index.html."))
    story.append(body("Validate: Rebuild, redeploy, and verify root URL serves the app."))

    story.append(body("<b>INC-003: Deal save fails with async listener message</b>"))
    story.append(body("Severity: SEV-1 when save flow is blocked | Owner: App + Firebase owner"))
    story.append(body("Error: Uncaught (in promise) Error: A listener indicated an asynchronous response..."))
    story.append(body("Observed Cause: Firebase APP ID typo in .env (y1:... instead of 1:...)."))
    story.append(body("Fix: Correct VITE_FIREBASE_APP_ID, restart dev/build, and hard refresh browser."))
    story.append(body("Validate: Confirm Firestore writes to loanApplications succeed."))

    story.append(section_heading("5. Standard Recovery Procedure"))
    story.append(body("1) Capture exact IIS/browser error text."))
    story.append(body("2) Match with runbook incident ID (INC-001/002/003)."))
    story.append(body("3) Apply config/env fix."))
    story.append(body("4) Run fresh build and redeploy only dist contents."))
    story.append(body("5) Smoke test /create -> /offers -> /summary end-to-end."))

    story.append(section_heading("6. Preventive Checklist"))
    checklist_data = [
        ["Check", "Status"],
        ["Deploy only dist contents", "Required"],
        ["Use remove-before-add for IIS collection entries", "Required"],
        ["Validate Firebase APP ID format before build", "Required"],
        ["Run post-deploy end-to-end smoke test", "Required"],
    ]
    checklist_tbl = Table(checklist_data, colWidths=[140 * mm, 18 * mm])
    checklist_tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E9EEF8")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CBD5E1")),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(checklist_tbl)

    doc.build(story)


if __name__ == "__main__":
    build_pdf()
    print(f"Generated: {OUTPUT_FILE}")
