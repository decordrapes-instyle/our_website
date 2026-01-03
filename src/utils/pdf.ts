export async function generateQuotationPDF(quotationData: any) {
  const BASE_URL = "https://quotation.up.railway.app"; 

  const response = await fetch(`${BASE_URL}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quotationData),
  });

  if (!response.ok) throw new Error("PDF generation failed");

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${quotationData.quotationNumber} - ${quotationData.customer.name}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
