import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface OrderItem {
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
  selected_size?: string | null;
  selected_color?: string | null;
  product_image?: string | null;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: {
    address: string;
    city: string;
    state: string;
    pincode: string;
  };
  total_amount: number;
  payment_status: string;
  payment_id: string;
  order_status: string;
  created_at: string;
  order_items: OrderItem[];
  dispatch_details?: string;
}

interface SiteSettings {
  site_name: string;
  contact_email: string;
  contact_phone: string;
}

interface BillSettings {
  logo_url?: string;
  company_name?: string;
  company_tagline?: string;
  company_address?: string;
  company_email?: string;
  company_phone?: string;
  company_gst?: string;
  layout_style?: 'modern' | 'classic' | 'minimal' | 'detailed';
  show_product_images?: boolean;
  show_shipping_label?: boolean;
  show_cut_line?: boolean;
  primary_color?: string;
  secondary_color?: string;
  header_bg_color?: string;
  table_header_color?: string;
  font_family?: string;
  header_font_size?: number;
  body_font_size?: number;
  footer_text?: string;
  thank_you_message?: string;
  from_name?: string;
  from_address?: string;
  from_city?: string;
  from_state?: string;
  from_pincode?: string;
  from_phone?: string;
}

const defaultBillSettings: BillSettings = {
  logo_url: '',
  company_name: 'Pixie Blooms',
  company_tagline: '',
  company_address: 'Atchukattu Street, Thiruppathur',
  company_email: 'pixieblooms2512@gmail.com',
  company_phone: '+91 9876543210',
  company_gst: '',
  layout_style: 'modern',
  show_product_images: true,
  show_shipping_label: true,
  show_cut_line: true,
  primary_color: '#000000',
  secondary_color: '#333333',
  header_bg_color: '#ffffff',
  table_header_color: '#000000',
  font_family: 'Inter',
  header_font_size: 24,
  body_font_size: 12,
  footer_text: 'This is a computer-generated invoice and does not require a signature.',
  thank_you_message: 'Thank you for your business!',
  from_name: 'Pixie Blooms',
  from_address: 'Atchukattu Street',
  from_city: 'Thiruppathur',
  from_state: 'Tamil Nadu',
  from_pincode: '630211',
  from_phone: '+91 9876543210',
};

export function generateBillHTML(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0, customSettings?: BillSettings): string {
  const s = { ...defaultBillSettings, ...customSettings };
  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const subtotal = order.order_items.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const total = subtotal + shippingCharge;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice - ${order.id}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${s.font_family}:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: '${s.font_family}', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 20px;
      background: #ffffff;
    }

    .invoice-container {
      max-width: 210mm;
      width: 100%;
      min-height: auto;
      margin: 0 auto;
      background: white;
      padding: 20px 30px;
      border: 2px solid ${s.primary_color};
      box-sizing: border-box;
    }

    @media screen and (min-width: 768px) {
      .invoice-container {
        width: 210mm;
        min-height: 297mm;
      }
    }

    .header {
      display: flex;
      flex-direction: column;
      gap: 15px;
      border-bottom: 2px solid ${s.primary_color};
      padding-bottom: 15px;
      margin-bottom: 20px;
      background: ${s.header_bg_color};
    }

    @media screen and (min-width: 768px) {
      .header {
        flex-direction: row;
        justify-content: space-between;
        align-items: start;
      }
    }

    .company-info {
      display: flex;
      align-items: flex-start;
      gap: 15px;
    }

    .company-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }

    .company-name {
      font-size: ${s.header_font_size}px;
      font-weight: bold;
      color: ${s.primary_color};
      margin-bottom: 5px;
    }

    .company-tagline {
      font-size: ${s.body_font_size}px;
      color: ${s.secondary_color};
      margin-bottom: 5px;
    }

    .company-details {
      font-size: ${s.body_font_size - 1}px;
      color: ${s.secondary_color};
      line-height: 1.5;
    }

    .invoice-title {
      text-align: left;
    }

    @media screen and (min-width: 768px) {
      .invoice-title {
        text-align: right;
      }
    }

    .invoice-title h1 {
      font-size: 28px;
      color: ${s.primary_color};
      margin-bottom: 5px;
    }

    .invoice-number {
      font-size: ${s.body_font_size}px;
      color: ${s.secondary_color};
      margin-bottom: 5px;
    }

    .order-date {
      font-size: ${s.body_font_size}px;
      color: #666666;
      margin-top: 5px;
    }

    .product-image {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border: 1px solid #cccccc;
      border-radius: 4px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: ${s.body_font_size}px;
    }

    .items-table thead {
      background: ${s.table_header_color};
      color: white;
    }

    .items-table th {
      padding: 10px 8px;
      text-align: left;
      font-size: ${s.body_font_size - 1}px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .items-table th:last-child,
    .items-table td:last-child {
      text-align: right;
    }

    .items-table tbody tr {
      border-bottom: 1px solid #cccccc;
    }

    .items-table tbody tr:last-child {
      border-bottom: 2px solid ${s.primary_color};
    }

    .items-table td {
      padding: 10px 8px;
      font-size: ${s.body_font_size}px;
      color: ${s.secondary_color};
      vertical-align: middle;
    }

    .item-details {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .item-info {
      flex: 1;
    }

    .items-table tbody tr:hover {
      background: #f5f5f5;
    }

    .totals {
      margin-left: auto;
      width: 100%;
      max-width: 250px;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: ${s.body_font_size}px;
    }

    .total-row.subtotal {
      color: ${s.secondary_color};
      border-bottom: 1px solid #cccccc;
    }

    .total-row.tax {
      color: ${s.secondary_color};
      border-bottom: 1px solid #cccccc;
    }

    .total-row.grand-total {
      background: ${s.primary_color};
      color: white;
      padding: 12px 15px;
      margin-top: 8px;
      border-radius: 0;
      font-size: 16px;
      font-weight: bold;
    }

    .payment-status {
      display: inline-block;
      padding: 4px 10px;
      border: 2px solid ${s.primary_color};
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 5px;
      background: white;
      color: ${s.primary_color};
    }

    .payment-status.completed {
      background: #e5e5e5;
      color: ${s.primary_color};
      border-color: ${s.primary_color};
    }

    .payment-status.pending {
      background: #f5f5f5;
      color: ${s.secondary_color};
      border-color: #666666;
    }

    .payment-status.failed {
      background: #cccccc;
      color: ${s.primary_color};
      border-color: ${s.primary_color};
    }

    .footer {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 2px solid ${s.primary_color};
      text-align: center;
      font-size: 10px;
      color: ${s.secondary_color};
    }

    .footer p {
      margin-bottom: 3px;
    }

    .thank-you {
      margin-top: 20px;
      text-align: center;
      font-size: 14px;
      color: ${s.primary_color};
      font-weight: 600;
    }

    .cut-line {
      margin: 20px 0 15px 0;
      border-top: 2px dashed #666666;
      position: relative;
      text-align: center;
    }

    .cut-line::before {
      content: '✂ CUT HERE ✂';
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      padding: 0 12px;
      font-size: 10px;
      color: ${s.primary_color};
      font-weight: 700;
      letter-spacing: 1px;
    }

    .shipping-labels {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-top: 15px;
    }

    @media screen and (min-width: 768px) {
      .shipping-labels {
        flex-direction: row;
      }
    }

    .label-box {
      flex: 1;
      border: 2px solid ${s.primary_color};
      padding: 15px;
      background: #ffffff;
    }

    .label-box h3 {
      font-size: 12px;
      color: ${s.primary_color};
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      font-weight: 700;
      border-bottom: 2px solid ${s.primary_color};
      padding-bottom: 5px;
    }

    .label-box p {
      font-size: 11px;
      color: ${s.primary_color};
      line-height: 1.6;
      margin-bottom: 4px;
      font-weight: 600;
    }

    .label-box strong {
      color: ${s.primary_color};
      font-weight: 700;
    }

    @media print {
      body {
        padding: 0;
        background: white;
      }

      .invoice-container {
        box-shadow: none;
        width: 210mm;
        min-height: 297mm;
      }

      .header {
        flex-direction: row;
      }

      .invoice-title {
        text-align: right;
      }

      .shipping-labels {
        flex-direction: row;
      }
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <div class="company-info">
        ${s.logo_url ? `<img src="${s.logo_url}" alt="Logo" class="company-logo" crossorigin="anonymous" />` : ''}
        <div>
          <div class="company-name">${s.company_name}</div>
          ${s.company_tagline ? `<div class="company-tagline">${s.company_tagline}</div>` : ''}
          <div class="company-details">
            <p>${s.company_email}</p>
            <p>${s.company_phone}</p>
            ${s.company_gst ? `<p>GST: ${s.company_gst}</p>` : ''}
          </div>
        </div>
      </div>
      <div class="invoice-title">
        <h1>INVOICE</h1>
        <p class="invoice-number">Order #${order.id.slice(0, 8).toUpperCase()}</p>
        <p class="order-date">${orderDate}</p>
        <div class="payment-status ${order.payment_status}">
          ${order.payment_status}
        </div>
      </div>
    </div>

    ${order.dispatch_details && order.dispatch_details.trim() !== '' ? `
    <div style="background: #e0f2fe; border: 2px solid #0ea5e9; border-radius: 6px; padding: 12px; margin: 15px 0;">
      <h3 style="margin: 0 0 8px 0; color: #0369a1; font-size: 12px;">Dispatch Details</h3>
      <p style="margin: 0; white-space: pre-wrap; color: #334155; font-size: 11px;">${order.dispatch_details}</p>
    </div>
    ` : ''}

    <table class="items-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${order.order_items.map(item => {
          const details = [];
          if (item.selected_size) details.push(`Size: ${item.selected_size}`);
          if (item.selected_color) details.push(`Color: ${item.selected_color}`);
          const detailsText = details.length > 0 ? `<br/><span style="font-size: 10px; color: #666;">${details.join(' • ')}</span>` : '';

          return `
          <tr>
            <td>
              <div class="item-details">
                ${s.show_product_images && item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" class="product-image" crossorigin="anonymous" />` : ''}
                <div class="item-info">
                  <strong>${item.product_name}</strong>${detailsText}
                </div>
              </div>
            </td>
            <td>${item.quantity}</td>
            <td>₹${Number(item.product_price).toFixed(2)}</td>
            <td>₹${Number(item.subtotal).toFixed(2)}</td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>

    <div class="totals">
      <div class="total-row subtotal">
        <span>Subtotal</span>
        <span>₹${subtotal.toFixed(2)}</span>
      </div>
      <div class="total-row tax">
        <span>Shipping Charge</span>
        <span>₹${shippingCharge.toFixed(2)}</span>
      </div>
      <div class="total-row grand-total">
        <span>Total Amount</span>
        <span>₹${total.toFixed(2)}</span>
      </div>
    </div>

    <div class="thank-you">
      ${s.thank_you_message}
    </div>

    ${s.show_cut_line ? `<div class="cut-line"></div>` : ''}

    ${s.show_shipping_label ? `
    <div class="shipping-labels">
      <div class="label-box">
        <h3>From</h3>
        <p><strong>${s.from_name}</strong></p>
        <p>${s.from_address}</p>
        <p>${s.from_city}, ${s.from_state}</p>
        <p><strong>PIN:</strong> ${s.from_pincode}</p>
        <p><strong>Mobile:</strong> ${s.from_phone}</p>
      </div>

      <div class="label-box">
        <h3>Ship To</h3>
        <p><strong>${order.customer_name}</strong></p>
        <p>${order.shipping_address.address}</p>
        <p>${order.shipping_address.city}, ${order.shipping_address.state}</p>
        <p><strong>PIN:</strong> ${order.shipping_address.pincode}</p>
        <p><strong>Mobile:</strong> ${order.customer_phone}</p>
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <p>${s.footer_text}</p>
      <p>For any queries, please contact us at ${s.company_email}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

async function createBillElement(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0): Promise<HTMLDivElement> {
  const billHTML = generateBillHTML(order, siteSettings, shippingCharge);

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '0';
  tempDiv.innerHTML = billHTML;
  document.body.appendChild(tempDiv);

  return tempDiv;
}

export async function downloadBillAsPDF(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0): Promise<void> {
  try {
    const tempDiv = await createBillElement(order, siteSettings, shippingCharge);
    const invoiceContainer = tempDiv.querySelector('.invoice-container') as HTMLElement;

    if (!invoiceContainer) {
      throw new Error('Invoice container not found');
    }

    const canvas = await html2canvas(invoiceContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`invoice-${order.id.slice(0, 8)}.pdf`);

    document.body.removeChild(tempDiv);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

export async function downloadBillAsJPG(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0): Promise<void> {
  try {
    const tempDiv = await createBillElement(order, siteSettings, shippingCharge);
    const invoiceContainer = tempDiv.querySelector('.invoice-container') as HTMLElement;

    if (!invoiceContainer) {
      throw new Error('Invoice container not found');
    }

    const canvas = await html2canvas(invoiceContainer, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    });

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `invoice-${order.id.slice(0, 8)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      document.body.removeChild(tempDiv);
    }, 'image/jpeg', 0.95);
  } catch (error) {
    console.error('Error generating JPG:', error);
    alert('Failed to generate JPG. Please try again.');
  }
}

export function printBill(order: Order, siteSettings: SiteSettings, shippingCharge: number = 0): void {
  const billHTML = generateBillHTML(order, siteSettings, shippingCharge);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(billHTML);
    printWindow.document.close();

    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
  }
}
