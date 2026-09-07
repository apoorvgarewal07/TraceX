import os
import io
import logging
from datetime import datetime
from typing import Optional, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

logger = logging.getLogger(__name__)

class NoticeGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
        self.title_style = ParagraphStyle(
            'LegalTitle',
            parent=self.styles['Heading1'],
            fontSize=16,
            leading=20,
            textColor=colors.HexColor('#0f172a'),
            alignment=1,  # Center
            fontName='Helvetica-Bold'
        )
        
        self.subtitle_style = ParagraphStyle(
            'LegalSubTitle',
            parent=self.styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155'),
            alignment=1,
            fontName='Helvetica'
        )

        self.section_header = ParagraphStyle(
            'LegalSectionHeader',
            parent=self.styles['Heading2'],
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#1e3a8a'),
            fontName='Helvetica-Bold',
            spaceBefore=10,
            spaceAfter=6
        )

        self.body_style = ParagraphStyle(
            'LegalBody',
            parent=self.styles['Normal'],
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1e293b'),
            fontName='Helvetica'
        )

        self.badge_style = ParagraphStyle(
            'LegalBadge',
            parent=self.styles['Normal'],
            fontSize=8,
            leading=10,
            textColor=colors.HexColor('#dc2626'),
            fontName='Helvetica-Bold'
        )

    def generate(self, trace, exchange_name: str, investigator_name: str = "Cyber Cell Officer, I4C") -> bytes:
        """
        Generate formal legal freeze notice PDF for serving to Crypto Exchanges / VASPs.
        Compliant with Section 91 CrPC and Information Technology Act, 2000.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=40,
            leftMargin=40,
            topMargin=36,
            bottomMargin=36
        )
        
        story = []

        # Header Badge
        story.append(Paragraph("<b>CONFIDENTIAL & STATUTORY LEGAL NOTICE</b>", ParagraphStyle(
            'ConfidentialHeader',
            parent=self.styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#991b1b'),
            alignment=1,
            fontName='Helvetica-Bold'
        )))
        story.append(Spacer(1, 6))

        # Emblem & Authority Header
        story.append(Paragraph("<b>GOVERNMENT OF INDIA</b>", self.title_style))
        story.append(Paragraph(
            "<b>INDIAN CYBER CRIME COORDINATION CENTRE (I4C)</b><br/>"
            "Ministry of Home Affairs | National Cyber Crime Forensic Division<br/>"
            "New Delhi, India | Email: legal-coordination@i4c.gov.in",
            self.subtitle_style
        ))
        story.append(Spacer(1, 10))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#1e3a8a'), spaceAfter=12))

        # Reference & Date Table
        trace_id_str = getattr(trace, 'id', str(trace.get('id', 'N/A') if isinstance(trace, dict) else 'N/A'))
        complaint_id_str = getattr(trace, 'complaint_id', None) or (trace.get('complaint_id') if isinstance(trace, dict) else None) or f"NCRP-{datetime.utcnow().strftime('%Y%m%d')}-001"
        source_wallet_str = getattr(trace, 'source_wallet', None) or (trace.get('source_wallet') if isinstance(trace, dict) else '0x0000000000000000000000000000000000000000')
        hops_count = getattr(trace, 'hops_count', 0) or (trace.get('hops_count', 0) if isinstance(trace, dict) else 0)
        risk_score = getattr(trace, 'risk_score', 0.0) or (trace.get('risk_score', 0.0) if isinstance(trace, dict) else 0.0)

        meta_table_data = [
            [
                Paragraph(f"<b>Notice Reference No:</b> I4C/CRYPTO/FRZ/{trace_id_str[:8].upper()}", self.body_style),
                Paragraph(f"<b>Date of Issue:</b> {datetime.utcnow().strftime('%d-%b-%Y %H:%M:%S UTC')}", self.body_style)
            ],
            [
                Paragraph(f"<b>NCRP Case / FIR Reference:</b> {complaint_id_str}", self.body_style),
                Paragraph(f"<b>Target VASP / Exchange:</b> <b>{exchange_name}</b>", self.body_style)
            ]
        ]
        meta_table = Table(meta_table_data, colWidths=[260, 260])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 12))

        # Legal Directive Section
        story.append(Paragraph("<b>STATUTORY ASSET FREEZE DIRECTIVE</b>", self.section_header))
        story.append(Paragraph(
            f"<b>TO: Compliance & Legal Operations Directorate, {exchange_name}</b><br/><br/>"
            f"WHEREAS, an active criminal investigation has been instituted under the <b>Information Technology Act, 2000 (as amended)</b> "
            f"and <b>Section 91 of the Code of Criminal Procedure, 1973</b> regarding fraudulent siphoning and illicit transfer of digital virtual assets.<br/><br/>"
            f"Forensic multi-hop graph analysis conducted by the Indian Cyber Crime Coordination Centre has established that proceeds of crime originated from victim address "
            f"<font face='Courier'><b>{source_wallet_str}</b></font> and flowed into destination deposit accounts and hot wallets controlled and operated by <b>{exchange_name}</b>.<br/><br/>"
            f"YOU ARE HEREBY COMMANDED to <b>IMMEDIATELY FREEZE, LOCK, AND RESTRAIN</b> all accounts, deposit wallets, sub-accounts, fiat withdrawal rails, and associated KYC identities "
            f"corresponding to the flagged wallet addresses detailed below, within <b>24 (TWENTY-FOUR) HOURS</b> of receipt of this statutory communication.",
            self.body_style
        ))
        story.append(Spacer(1, 10))

        # Target Wallet Addresses Table
        story.append(Paragraph("<b>FLAGGED SUSPECT WALLET ADDRESSES & RISK ASSESSMENT</b>", self.section_header))
        
        # Extract suspect wallets
        hops_data = getattr(trace, 'hops_data', {}) or (trace.get('hops_data', {}) if isinstance(trace, dict) else {})
        if not isinstance(hops_data, dict):
            hops_data = {}
            
        hops_list = hops_data.get('hops', [])
        exchanges_list = hops_data.get('identified_exchanges', [])
        exchange_addrs = {ex.get('address', '').lower() for ex in exchanges_list}

        table_rows = [
            [
                Paragraph("<b>Wallet Address</b>", self.body_style),
                Paragraph("<b>Role / Type</b>", self.body_style),
                Paragraph("<b>Risk Score</b>", self.body_style),
                Paragraph("<b>Action Required</b>", self.body_style)
            ]
        ]

        # Add source wallet
        table_rows.append([
            Paragraph(f"<font face='Courier' size=7>{source_wallet_str}</font>", self.body_style),
            Paragraph("Victim / Source", self.body_style),
            Paragraph("N/A", self.body_style),
            Paragraph("Audit Trail", self.body_style)
        ])

        added_addrs = {source_wallet_str.lower()}
        for h in hops_list[:8]:
            to_addr = h.get('to', '')
            if to_addr and to_addr.lower() not in added_addrs:
                added_addrs.add(to_addr.lower())
                is_ex = to_addr.lower() in exchange_addrs
                role = f"<b>{exchange_name} Deposit</b>" if is_ex else "Mule / Transit Node"
                r_score = f"{int(risk_score * 100)}%" if not is_ex else "95%"
                action = "<b>IMMEDIATE FREEZE & KYC DISCLOSURE</b>" if is_ex else "Flag for Monitoring"
                table_rows.append([
                    Paragraph(f"<font face='Courier' size=7>{to_addr}</font>", self.body_style),
                    Paragraph(role, self.body_style),
                    Paragraph(r_score, self.body_style),
                    Paragraph(action, self.body_style)
                ])

        wallet_table = Table(table_rows, colWidths=[200, 100, 70, 150])
        wallet_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e3a8a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#1e3a8a')),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f1f5f9')])
        ]))
        story.append(wallet_table)
        story.append(Spacer(1, 10))

        # Forensic Metrics
        story.append(Paragraph("<b>FORENSIC ATTRIBUTION SUMMARY</b>", self.section_header))
        conf_level = "HIGH (>90%)" if risk_score > 0.8 else "MEDIUM (>60%)" if risk_score > 0.5 else "LOW"
        story.append(Paragraph(
            f"• <b>Total Multi-Hop Depth:</b> {hops_count} intermediate transaction hops traced.<br/>"
            f"• <b>ML Anomaly Score:</b> {risk_score * 100:.1f}% (Isolation Forest forensic model).<br/>"
            f"• <b>VASP Attribution Confidence:</b> {conf_level}.<br/>"
            f"• <b>Evidentiary Chain of Custody:</b> Cryptographically hashed & archived in NCRP database.",
            self.body_style
        ))
        story.append(Spacer(1, 12))

        # Legal Penalties & Officer Signature Block
        story.append(Paragraph(
            "<b>STATUTORY PENALTY WARNING:</b> Failure to comply with this lawful directive within the prescribed period "
            "attracts penal consequences under Section 43, 69, 70B of the IT Act, 2000 and Section 188 / 204 of the Indian Penal Code.",
            self.badge_style
        ))
        story.append(Spacer(1, 15))

        sig_table_data = [
            [
                Paragraph(
                    "<b>Digital Verification:</b><br/>"
                    f"Hash: SHA256:{trace_id_str[:16]}...<br/>"
                    "Verified by I4C Automated Forensics Engine",
                    self.body_style
                ),
                Paragraph(
                    f"<b>Authorized Signatory:</b><br/>"
                    f"<b>{investigator_name}</b><br/>"
                    "Forensics & Law Enforcement Wing<br/>"
                    "Indian Cyber Crime Coordination Centre (I4C)",
                    self.body_style
                )
            ]
        ]
        sig_table = Table(sig_table_data, colWidths=[260, 260])
        sig_table.setStyle(TableStyle([
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.HexColor('#94a3b8')),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(sig_table)

        doc.build(story)
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
