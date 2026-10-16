package com.gymmanager.util;

import com.gymmanager.entity.Invoice;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;

@Component
public class PdfReportGenerator {

    public byte[] generateInvoicePdf(Invoice invoice) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 36, 36, 36, 36);

        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Colors
            Color primaryColor = new Color(16, 185, 129); // Gym Emerald
            Color darkColor = new Color(15, 23, 42);
            Color grayColor = new Color(100, 116, 139);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, primaryColor);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, darkColor);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10, darkColor);
            Font boldBodyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, darkColor);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8, grayColor);

            // Header Table
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);

            PdfPCell companyCell = new PdfPCell();
            companyCell.setBorder(Rectangle.NO_BORDER);
            companyCell.addElement(new Paragraph("FITPULSE GYM & FITNESS", titleFont));
            String branchName = invoice.getBranch() != null ? invoice.getBranch().getName() : "Main Branch";
            companyCell.addElement(new Paragraph(branchName, bodyFont));
            String gstin = invoice.getBranch() != null && invoice.getBranch().getTaxNumber() != null
                    ? "GSTIN: " + invoice.getBranch().getTaxNumber()
                    : "GSTIN: 29AAAAA0000A1Z5";
            companyCell.addElement(new Paragraph(gstin, smallFont));
            headerTable.addCell(companyCell);

            PdfPCell invoiceMetaCell = new PdfPCell();
            invoiceMetaCell.setBorder(Rectangle.NO_BORDER);
            invoiceMetaCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
            Paragraph invTitle = new Paragraph("TAX INVOICE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, darkColor));
            invTitle.setAlignment(Element.ALIGN_RIGHT);
            invoiceMetaCell.addElement(invTitle);
            Paragraph invNum = new Paragraph("Invoice #: " + invoice.getInvoiceNumber(), boldBodyFont);
            invNum.setAlignment(Element.ALIGN_RIGHT);
            invoiceMetaCell.addElement(invNum);
            Paragraph invDate = new Paragraph("Date: " + invoice.getInvoiceDate().format(DateTimeFormatter.ISO_LOCAL_DATE), bodyFont);
            invDate.setAlignment(Element.ALIGN_RIGHT);
            invoiceMetaCell.addElement(invDate);
            Paragraph invStatus = new Paragraph("Status: " + invoice.getStatus(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, primaryColor));
            invStatus.setAlignment(Element.ALIGN_RIGHT);
            invoiceMetaCell.addElement(invStatus);
            headerTable.addCell(invoiceMetaCell);

            document.add(headerTable);
            document.add(new Paragraph(" "));

            // Billed To
            PdfPTable billedTable = new PdfPTable(1);
            billedTable.setWidthPercentage(100);
            PdfPCell billedCell = new PdfPCell();
            billedCell.setBackgroundColor(new Color(248, 250, 252));
            billedCell.setPadding(8);
            billedCell.addElement(new Paragraph("BILLED TO:", boldBodyFont));
            billedCell.addElement(new Paragraph(invoice.getMember().getFullName(), boldBodyFont));
            billedCell.addElement(new Paragraph("Email: " + invoice.getMember().getEmail(), bodyFont));
            if (invoice.getMember().getPhone() != null) {
                billedCell.addElement(new Paragraph("Phone: " + invoice.getMember().getPhone(), bodyFont));
            }
            billedTable.addCell(billedCell);
            document.add(billedTable);
            document.add(new Paragraph(" "));

            // Items Table
            PdfPTable itemsTable = new PdfPTable(new float[]{4, 2, 2, 2});
            itemsTable.setWidthPercentage(100);

            PdfPCell h1 = new PdfPCell(new Phrase("Description", headerFont));
            h1.setBackgroundColor(new Color(241, 245, 249));
            h1.setPadding(6);
            PdfPCell h2 = new PdfPCell(new Phrase("Amount (INR)", headerFont));
            h2.setBackgroundColor(new Color(241, 245, 249));
            h2.setPadding(6);
            PdfPCell h3 = new PdfPCell(new Phrase("Discount (INR)", headerFont));
            h3.setBackgroundColor(new Color(241, 245, 249));
            h3.setPadding(6);
            PdfPCell h4 = new PdfPCell(new Phrase("GST @ 18%", headerFont));
            h4.setBackgroundColor(new Color(241, 245, 249));
            h4.setPadding(6);

            itemsTable.addCell(h1);
            itemsTable.addCell(h2);
            itemsTable.addCell(h3);
            itemsTable.addCell(h4);

            String desc = "Gym Membership Subscription";
            if (invoice.getPayment() != null && invoice.getPayment().getSubscription() != null) {
                desc = invoice.getPayment().getSubscription().getPlan().getName();
            }

            PdfPCell c1 = new PdfPCell(new Phrase(desc, bodyFont));
            c1.setPadding(6);
            PdfPCell c2 = new PdfPCell(new Phrase("Rs. " + invoice.getSubtotal().toString(), bodyFont));
            c2.setPadding(6);
            PdfPCell c3 = new PdfPCell(new Phrase("Rs. " + invoice.getDiscountAmount().toString(), bodyFont));
            c3.setPadding(6);
            PdfPCell c4 = new PdfPCell(new Phrase("Rs. " + invoice.getTaxAmount().toString(), bodyFont));
            c4.setPadding(6);

            itemsTable.addCell(c1);
            itemsTable.addCell(c2);
            itemsTable.addCell(c3);
            itemsTable.addCell(c4);

            document.add(itemsTable);
            document.add(new Paragraph(" "));

            // Total Table
            PdfPTable totalTable = new PdfPTable(2);
            totalTable.setWidthPercentage(50);
            totalTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            PdfPCell subtotalLabel = new PdfPCell(new Phrase("Subtotal:", bodyFont));
            subtotalLabel.setBorder(Rectangle.NO_BORDER);
            PdfPCell subtotalVal = new PdfPCell(new Phrase("Rs. " + invoice.getSubtotal(), bodyFont));
            subtotalVal.setBorder(Rectangle.NO_BORDER);
            subtotalVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalTable.addCell(subtotalLabel);
            totalTable.addCell(subtotalVal);

            PdfPCell taxLabel = new PdfPCell(new Phrase("GST (18%):", bodyFont));
            taxLabel.setBorder(Rectangle.NO_BORDER);
            PdfPCell taxVal = new PdfPCell(new Phrase("Rs. " + invoice.getTaxAmount(), bodyFont));
            taxVal.setBorder(Rectangle.NO_BORDER);
            taxVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalTable.addCell(taxLabel);
            totalTable.addCell(taxVal);

            PdfPCell grandLabel = new PdfPCell(new Phrase("Grand Total:", headerFont));
            grandLabel.setPaddingTop(6);
            PdfPCell grandVal = new PdfPCell(new Phrase("Rs. " + invoice.getGrandTotal(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, primaryColor)));
            grandVal.setPaddingTop(6);
            grandVal.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalTable.addCell(grandLabel);
            totalTable.addCell(grandVal);

            document.add(totalTable);

            // Footer
            Paragraph footer = new Paragraph("\n\nThank you for choosing FitPulse Gym! For queries, contact support@gymmanager.in", smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        } catch (DocumentException e) {
            throw new RuntimeException("Error generating PDF invoice", e);
        }

        return out.toByteArray();
    }
}
