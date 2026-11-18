import { useEffect, useRef } from "react";
import * as $3Dmol from "3dmol";

const COLORES = { H: "#ffffff", Li: "#cc80ff" };

export default function Molecula3D({ molecula, distancia, distanciaMax }) {
  const caja = useRef(null);
  const visor = useRef(null);

  useEffect(() => {
    const v = $3Dmol.createViewer(caja.current, {
      backgroundColor: "#111827",
      antialias: true,
    });
    visor.current = v;

    dibujar(v, molecula, distanciaMax);
    v.zoomTo();
    v.zoom(2.6);
    dibujar(v, molecula, distancia);
    return () => {
      try {
        v.clear();
      } catch (e) {
        throw new Error(e);
      }
    };
  }, [molecula]);

  useEffect(() => {
    if (visor.current) dibujar(visor.current, molecula, distancia);
  }, [distancia, molecula]);

  return (
    <div
      ref={caja}
      className="visor3d"
      role="img"
      aria-label={`Modelo 3D de ${molecula} a ${distancia} angstroms`}
    />
  );
}

function dibujar(v, molecula, d) {
  const otro = molecula === "H2" ? "H" : "Li";
  const xyz = `2\n\n${otro} ${(-d / 2).toFixed(4)} 0 0\nH ${(d / 2).toFixed(4)} 0 0`;
  v.removeAllModels();
  v.removeAllShapes();
  const m = v.addModel(xyz, "xyz");
  m.setStyle({ atom: "H" }, { sphere: { radius: 0.32, color: COLORES.H } });
  m.setStyle({ atom: "Li" }, { sphere: { radius: 0.5, color: COLORES.Li } });

  v.addCylinder({
    start: { x: -d / 2, y: 0, z: 0 },
    end: { x: d / 2, y: 0, z: 0 },
    radius: 0.07,
    color: "#94a3b8",
    fromCap: 1,
    toCap: 1,
  });
  v.render();
}
