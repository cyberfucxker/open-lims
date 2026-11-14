import * as bwipjs from "bwip-js";
import { ApiError } from "../utils/ApiError";

/** Renders a Code128 barcode (a good general-purpose choice for alphanumeric
 *  IDs like "LAB000123") for the given text and returns it as a base64 PNG
 *  data URI, ready to drop straight into an <img src>. */
export async function generateBarcodeDataUri(text: string): Promise<string> {
  try {
    const png = await bwipjs.toBuffer({
      bcid: "code128",
      text,
      scale: 3,
      height: 12,
      includetext: true,
      textxalign: "center",
    });
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    throw ApiError.internal("Failed to generate barcode");
  }
}
