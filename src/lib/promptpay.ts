import generatePayload from "promptpay-qr";
import QRCode from "qrcode";

/**
 * Build a dynamic PromptPay QR (EMVCo standard) for a specific order amount
 * and return it as a data: URL PNG image, ready to render in an <img> tag.
 */
export async function generatePromptPayQrDataUrl(
  promptpayId: string,
  amount: number
): Promise<string> {
  const payload = generatePayload(promptpayId, { amount });
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 320,
  });
}
