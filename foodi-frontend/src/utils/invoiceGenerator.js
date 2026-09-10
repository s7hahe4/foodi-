import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generates and downloads a branded PDF invoice for a given order
 * @param {Object} order - Order object containing id, restaurant_name, total_price, delivery_fee, created_at, items, customer_username
 */
export const generateOrderInvoicePDF = (order) => {
    if (!order) return;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ── Colors ──
    const primaryColor = [230, 126, 34];    // #e67e22 Foodi++ Orange
    const darkSlate = [30, 41, 59];         // #1e293b Dark Slate
    const mutedGray = [100, 116, 139];      // #64748b Gray
    const lightBg = [248, 250, 252];        // #f8fafc Light Gray
    const successGreen = [22, 163, 74];     // #16a34a Green

    // ── 1. Top Header Accent Bar ──
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 6, 'F');

    // ── 2. Brand & Invoice Title ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...darkSlate);
    doc.text('Foodi', 20, 22);

    doc.setTextColor(...primaryColor);
    doc.text('++', 43, 22);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedGray);
    doc.text('Premium On-Demand Food Delivery', 20, 27);

    // Invoice Header on Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...darkSlate);
    doc.text('TAX INVOICE', pageWidth - 20, 20, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedGray);
    doc.text(`Invoice Ref: INV-${new Date().getFullYear()}-${order.id}`, pageWidth - 20, 26, { align: 'right' });

    const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    doc.text(`Issue Date: ${orderDate}`, pageWidth - 20, 31, { align: 'right' });

    // Payment Status Pill
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(187, 247, 208);
    doc.roundedRect(pageWidth - 55, 35, 35, 7, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...successGreen);
    doc.text('PAID (VERIFIED)', pageWidth - 37.5, 39.8, { align: 'center' });

    // Divider Line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(20, 46, pageWidth - 20, 46);

    // ── 3. Billing & Restaurant Details (Two-Column Layout) ──
    const col1X = 20;
    const col2X = pageWidth / 2 + 10;
    const boxY = 52;

    // Left Column: Customer Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkSlate);
    doc.text('BILLED TO (CUSTOMER):', col1X, boxY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedGray);
    doc.text(`Customer: ${order.customer_username || 'Valued Foodi++ Member'}`, col1X, boxY + 6);
    doc.text(`Order Number: #${order.id}`, col1X, boxY + 11);
    doc.text(`Payment Gateway: Online Checkout (Confirmed)`, col1X, boxY + 16);

    // Right Column: Restaurant Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...darkSlate);
    doc.text('PREPARED BY (MERCHANT):', col2X, boxY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...mutedGray);
    doc.text(`Restaurant: ${order.restaurant_name || 'Foodi++ Partner'}`, col2X, boxY + 6);
    doc.text(`Platform: Foodi++ Hyperlocal Network`, col2X, boxY + 11);
    doc.text(`Status: ${order.status || 'Completed'}`, col2X, boxY + 16);

    // ── 4. Itemized Order Table ──
    const tableStartY = boxY + 26;

    const tableRows = (order.items || []).map((item, index) => {
        const qty = parseInt(item.quantity || 1, 10);
        const price = parseFloat(item.item_price || 0);
        const subtotal = (qty * price).toFixed(2);
        return [
            (index + 1).toString(),
            item.item_name || 'Menu Dish',
            qty.toString(),
            `BDT ${price.toFixed(2)}`,
            `BDT ${subtotal}`
        ];
    });

    autoTable(doc, {
        startY: tableStartY,
        margin: { left: 20, right: 20 },
        head: [['#', 'Dish / Item Description', 'Qty', 'Unit Price', 'Amount']],
        body: tableRows.length > 0 ? tableRows : [['1', 'Delicious Meal', '1', `BDT ${order.total_price}`, `BDT ${order.total_price}`]],
        theme: 'plain',
        headStyles: {
            fillColor: [30, 41, 59],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            cellPadding: 3.5
        },
        bodyStyles: {
            textColor: [51, 65, 85],
            fontSize: 8.5,
            cellPadding: 3.5
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 18, halign: 'center' },
            3: { cellWidth: 32, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
        }
    });

    // ── 5. Financial Summary Box ──
    const finalY = doc.lastAutoTable.finalY + 8;
    const summaryWidth = 85;
    const summaryX = pageWidth - 20 - summaryWidth;

    const deliveryFee = parseFloat(order.delivery_fee || 0);
    const totalPrice = parseFloat(order.total_price || 0);
    const itemsSubtotal = (order.items && order.items.length > 0)
        ? order.items.reduce((sum, it) => sum + (parseFloat(it.item_price || 0) * parseInt(it.quantity || 1, 10)), 0)
        : (totalPrice - deliveryFee);

    doc.setFillColor(...lightBg);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(summaryX, finalY, summaryWidth, 36, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...mutedGray);

    doc.text('Items Subtotal:', summaryX + 6, finalY + 8);
    doc.text(`BDT ${itemsSubtotal.toFixed(2)}`, summaryX + summaryWidth - 6, finalY + 8, { align: 'right' });

    doc.text('Delivery Courier Fee:', summaryX + 6, finalY + 15);
    doc.text(`BDT ${deliveryFee.toFixed(2)}`, summaryX + summaryWidth - 6, finalY + 15, { align: 'right' });

    doc.text('Taxes & Packaging:', summaryX + 6, finalY + 22);
    doc.text('BDT 0.00 (Included)', summaryX + summaryWidth - 6, finalY + 22, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.line(summaryX + 6, finalY + 25.5, summaryX + summaryWidth - 6, finalY + 25.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...primaryColor);
    doc.text('Total Paid:', summaryX + 6, finalY + 31.5);
    doc.text(`BDT ${totalPrice.toFixed(2)}`, summaryX + summaryWidth - 6, finalY + 31.5, { align: 'right' });

    // ── 6. Verification & QR / Digital Seal Note ──
    const noteY = finalY + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...darkSlate);
    doc.text('Digital Receipt Verification', 20, noteY);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...mutedGray);
    doc.text('This receipt was electronically generated by Foodi++ and confirms', 20, noteY + 5);
    doc.text('successful digital settlement between customer and merchant partner.', 20, noteY + 9.5);
    doc.text(`Courier tracking log & timestamp: ${new Date().toISOString()}`, 20, noteY + 14);

    // ── 7. Footer ──
    doc.setDrawColor(226, 232, 240);
    doc.line(20, pageHeight - 16, pageWidth - 20, pageHeight - 16);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...mutedGray);
    doc.text('Foodi++ Food Delivery Platform • Dhaka, Bangladesh • Support: help@foodiplus.com', 20, pageHeight - 10);
    doc.text(`Page 1 of 1 • Order #${order.id}`, pageWidth - 20, pageHeight - 10, { align: 'right' });

    // Save PDF
    doc.save(`Foodi_Invoice_Order_${order.id}.pdf`);
};
