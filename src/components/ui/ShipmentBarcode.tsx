"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface ShipmentBarcodeProps {
  value: string;
  width?: number;
  height?: number;
}

export default function ShipmentBarcode({ value, width = 320, height = 72 }: ShipmentBarcodeProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        margin: 0,
        height,
        width: 2.1,
        textMargin: 4,
      });
    } catch {
      // Fallback text stays visible if barcode rendering fails.
    }
  }, [value, height]);

  return <svg ref={svgRef} width={width} height={height + 34} role="img" aria-label={`Barcode for ${value}`} />;
}

