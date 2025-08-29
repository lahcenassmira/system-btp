// Test script to create a sample invoice and test PDF generation
const testInvoice = {
  customerName: "Test Customer",
  customerPhone: "0612345678",
  customerEmail: "test@example.com",
  customerAddress: "123 Test Street, Casablanca",
  customerICE: "123456789012345",
  items: [
    {
      productId: "test-product-1",
      name: "Produit Test 1",
      quantity: 2,
      unitPrice: 100,
      discount: 0,
      totalPrice: 200
    },
    {
      productId: "test-product-2", 
      name: "Produit Test 2",
      quantity: 1,
      unitPrice: 50,
      discount: 10,
      totalPrice: 45
    }
  ],
  discount: 5,
  taxRate: 20,
  paymentMethod: "cash",
  paidAmount: 245,
  notes: "Facture de test pour validation du système",
  shopName: "Mon Hanout Test",
  shopAddress: "456 Commerce Street, Rabat",
  shopPhone: "0523456789",
  shopICE: "987654321098765",
  shopRC: "RC123456"
};

console.log("Sample invoice data:");
console.log(JSON.stringify(testInvoice, null, 2));

console.log("\nTo test the invoice API:");
console.log("1. Start the development server: npm run dev");
console.log("2. Login to get a JWT token");
console.log("3. Create an invoice using POST /api/invoices");
console.log("4. Test PDF generation using GET /api/invoices/{id}/pdf");
