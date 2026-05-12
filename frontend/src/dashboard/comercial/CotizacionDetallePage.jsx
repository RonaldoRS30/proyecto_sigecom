import React from "react";
import { useParams } from "react-router-dom";
import CotizacionPremiumDetail from "./CotizacionPremiumDetail";

export default function CotizacionDetallePage({ esOportunidad = false }) {
  const { numReg } = useParams();

  return (
    <CotizacionPremiumDetail numReg={numReg} esOportunidad={esOportunidad} />
  );
}
