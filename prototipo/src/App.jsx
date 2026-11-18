import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import datos from "./datos.json";
import Molecula3D from "./Molecula3D.jsx";

const UMBRAL = 1.6; // mHa, precisión química
const COL = {
  fci: "var(--texto)",
  hf: "#c2410c",
  ucc: "#0072b2",
  ra: "#15803d",
};
const NOMBRE = { H2: "H₂", LiH: "LiH" };
const PISO = 1e-6; // para graficar errores casi nulos en escala log

const fmt = (x, d = 4) => (Math.abs(x) < 1e-4 ? "<0.0001" : x.toFixed(d));
const SERIES = [
  { clave: "fci", nombre: "FCI exacto", color: COL.fci },
  { clave: "hf", nombre: "Hartree–Fock", color: COL.hf },
  { clave: "ucc", nombre: "VQE · UCCSD", color: COL.ucc },
  { clave: "ra", nombre: "VQE · RealAmplitudes", color: COL.ra },
];

export default function App() {
  const [mol, setMol] = useState("H2");
  const [seriesVisibles, setSeriesVisibles] = useState({
    fci: true,
    hf: true,
    ucc: true,
    ra: true,
  });
  const filas = useMemo(() => datos.filter((r) => r.molecula === mol), [mol]);
  const [i, setI] = useState(() =>
    datos
      .filter((r) => r.molecula === "H2")
      .findIndex((r) => r.distancia_A === 0.7),
  );
  const idx = Math.min(i, filas.length - 1);
  const fila = filas[idx];
  const dMax = filas[filas.length - 1].distancia_A;

  const serie = useMemo(
    () =>
      filas.map((r) => ({
        d: r.distancia_A,
        fci: r.E_FCI,
        hf: r.E_HF,
        ucc: r.E_VQE_UCCSD,
        ra: r.E_VQE_RealAmp,
        eHF: Math.max(Math.abs(r.err_HF_mHa), PISO),
        eUCC: Math.max(Math.abs(r.err_VQE_UCCSD_mHa), PISO),
        eRA: Math.max(Math.abs(r.err_VQE_RealAmp_mHa), PISO),
        nUCC: r.evals_uccsd,
        nRA: r.evals_ra,
      })),
    [filas],
  );

  const cambiarMol = (m) => {
    setMol(m);
    const f = datos.filter((r) => r.molecula === m);
    const eq = m === "H2" ? 0.7 : 1.5;
    setI(
      Math.max(
        0,
        f.findIndex((r) => r.distancia_A === eq),
      ),
    );
  };

  const seleccionarDistanciaEnGrafica = (evento) => {
    if (evento?.activeLabel == null) return;
    const distancia = Number(evento.activeLabel);
    const indice = filas.findIndex((r) => r.distancia_A === distancia);
    if (indice >= 0) setI(indice);
  };

  const alternarSerie = (clave) => {
    setSeriesVisibles((actuales) => ({
      ...actuales,
      [clave]: !actuales[clave],
    }));
  };

  const metodos = [
    {
      clave: "HF",
      nombre: "Hartree-Fock",
      err: fila.err_HF_mHa,
      color: COL.hf,
    },
    {
      clave: "UCC",
      nombre: "VQE · UCCSD",
      err: fila.err_VQE_UCCSD_mHa,
      color: COL.ucc,
      ev: fila.evals_uccsd,
    },
    {
      clave: "RA",
      nombre: "VQE · RealAmplitudes",
      err: fila.err_VQE_RealAmp_mHa,
      color: COL.ra,
      ev: fila.evals_ra,
    },
  ];

  return (
    <main className="pagina">
      <header className="encabezado">
        <p className="etiqueta">
          Producto integrador · Química basada en datos
        </p>
        <h1>Simulación molecular con VQE: H₂ y LiH</h1>
        <p className="sub">
          Datos de 34 simulaciones sin ruido (base STO-3G). El error se mide
          contra la energía exacta (FCI); la precisión química es {UMBRAL} mHa.
        </p>
      </header>

      <section className="panel controles" aria-label="Controles">
        <div className="grupo" role="group" aria-label="Molécula">
          {["H2", "LiH"].map((m) => (
            <button
              key={m}
              className={m === mol ? "btn activo" : "btn"}
              onClick={() => cambiarMol(m)}
              aria-pressed={m === mol}
            >
              {NOMBRE[m]}
            </button>
          ))}
        </div>
        <label className="deslizador">
          <span>
            Distancia del enlace:{" "}
            <strong>{fila.distancia_A.toFixed(2)} Å</strong>
          </span>
          <input
            type="range"
            min={0}
            max={filas.length - 1}
            step={1}
            value={idx}
            onChange={(e) => setI(Number(e.target.value))}
            aria-label="Distancia del enlace"
            aria-valuetext={`${fila.distancia_A.toFixed(2)} angstroms`}
          />
          <span className="rango">
            {filas[0].distancia_A} Å – {dMax} Å
          </span>
        </label>
      </section>

      <section className="fila2">
        <div className="panel">
          <h2>Modelo 3D</h2>
          <Molecula3D
            molecula={mol}
            distancia={fila.distancia_A}
            distanciaMax={dMax}
          />
          <p className="nota">
            Esferas a escala aproximada; la barra gris es solo una guía visual
            del enlace.
          </p>
        </div>
        <div className="panel">
          <h2>Resultado a {fila.distancia_A.toFixed(2)} Å</h2>
          <p className="energia">
            Energía exacta (FCI): <strong>{fila.E_FCI.toFixed(5)} Ha</strong>
          </p>
          <div className="tabla-contenedor">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Método</th>
                  <th>Error (mHa)</th>
                  <th>¿Precisión química?</th>
                  <th>Evaluaciones</th>
                </tr>
              </thead>
              <tbody>
                {metodos.map((m) => {
                  const ok = Math.abs(m.err) <= UMBRAL;
                  return (
                    <tr key={m.clave}>
                      <td>
                        <span className="punto" style={{ background: m.color }} />
                        {m.nombre}
                      </td>
                      <td className="num">{fmt(m.err)}</td>
                      <td>
                        <span className={ok ? "ins ok" : "ins mal"}>
                          {ok ? "Sí" : "No"}
                        </span>
                      </td>
                      <td className="num">{m.ev ?? "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="nota">
            Un «Sí» no siempre significa mérito del VQE: si Hartree-Fock ya
            cumple el umbral, hay poca correlación que recuperar.
          </p>
        </div>
      </section>

      <section className="explorador panel" aria-labelledby="titulo-explorador">
        <div className="explorador-cabecera">
          <div>
            <h2 id="titulo-explorador">Explora los resultados</h2>
            <p className="nota">
              Activa o desactiva las series en las gráficas donde aparecen. Haz
              clic en un punto para seleccionar esa distancia.
            </p>
          </div>
          <span className="distancia-seleccionada">
            {NOMBRE[mol]} · {fila.distancia_A.toFixed(2)} Å
          </span>
        </div>
        <div className="filtros-series" role="group" aria-label="Métodos visibles">
          {SERIES.map((serieItem) => (
            <button
              key={serieItem.clave}
              type="button"
              className={`filtro-serie${seriesVisibles[serieItem.clave] ? " activo" : ""}`}
              onClick={() => alternarSerie(serieItem.clave)}
              aria-pressed={seriesVisibles[serieItem.clave]}
            >
              <span
                className="muestra-serie"
                style={{ "--color-serie": serieItem.color }}
                aria-hidden="true"
              />
              {serieItem.nombre}
            </button>
          ))}
          <button
            type="button"
            className="restablecer-series"
            onClick={() =>
              setSeriesVisibles({ fci: true, hf: true, ucc: true, ra: true })
            }
          >
            Mostrar todos
          </button>
        </div>
      </section>

      <div className="graficas">
      <section className="panel grafica grafica-energia">
        <div className="grafica-cabecera">
          <div>
            <h2>Energía del estado fundamental</h2>
            <p className="nota">La energía más baja indica un estado más estable.</p>
          </div>
          <span className="unidad-grafica">Ha</span>
        </div>
        <div className="graf">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={serie}
              margin={{ top: 8, right: 16, bottom: 20, left: 8 }}
              onClick={seleccionarDistanciaEnGrafica}
              accessibilityLayer
            >
              <CartesianGrid stroke="var(--rejilla)" vertical={false} />
              <XAxis
                dataKey="d"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => v.toFixed(1)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--texto2)", fontSize: 12 }}
                label={{
                  value: "Distancia interatómica (Å)",
                  position: "insideBottom",
                  offset: -10,
                  fill: "var(--texto2)",
                  fontSize: 12,
                }}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => v.toFixed(2)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--texto2)", fontSize: 12 }}
                width={64}
              />
              <Tooltip
                formatter={(v) => `${Number(v).toFixed(5)} Ha`}
                labelFormatter={(l) => `Distancia: ${Number(l).toFixed(2)} Å`}
                cursor={{ stroke: "var(--acento)", strokeDasharray: "4 4" }}
                contentStyle={{
                  background: "var(--panel)",
                  border: "1px solid var(--borde)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                  padding: "10px 12px",
                }}
              />
              <ReferenceLine
                x={fila.distancia_A}
                stroke="var(--acento)"
                strokeDasharray="4 3"
              />
              <Line
                name="FCI (exacto)"
                dataKey="fci"
                stroke={COL.fci}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
                hide={!seriesVisibles.fci}
                isAnimationActive={false}
              />
              <Line
                name="Hartree-Fock"
                dataKey="hf"
                stroke={COL.hf}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
                hide={!seriesVisibles.hf}
                isAnimationActive={false}
              />
              <Line
                name="VQE UCCSD"
                dataKey="ucc"
                stroke={COL.ucc}
                strokeWidth={0}
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                hide={!seriesVisibles.ucc}
                isAnimationActive={false}
              />
              <Line
                name="VQE RealAmplitudes"
                dataKey="ra"
                stroke={COL.ra}
                strokeWidth={0}
                dot={{ r: 3, strokeWidth: 2, fill: "none" }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                hide={!seriesVisibles.ra}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="panel grafica grafica-error">
        <div className="grafica-cabecera">
          <div>
            <h2>Error respecto a FCI</h2>
            <p className="nota">
              Escala logarítmica · por debajo de la línea se alcanza la
              precisión química.
            </p>
          </div>
          <span className="unidad-grafica">mHa</span>
        </div>
        <div className="graf">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={serie}
              margin={{ top: 8, right: 16, bottom: 20, left: 8 }}
              onClick={seleccionarDistanciaEnGrafica}
              accessibilityLayer
            >
              <CartesianGrid stroke="var(--rejilla)" vertical={false} />
              <XAxis
                dataKey="d"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => v.toFixed(1)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--texto2)", fontSize: 12 }}
                label={{
                  value: "Distancia interatómica (Å)",
                  position: "insideBottom",
                  offset: -10,
                  fill: "var(--texto2)",
                  fontSize: 12,
                }}
              />
              <YAxis
                scale="log"
                domain={[PISO, 1000]}
                allowDataOverflow
                ticks={[1e-6, 1e-4, 1e-2, 1, 100]}
                tickFormatter={(v) =>
                  v < 0.01 ? v.toExponential(0) : String(v)
                }
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--texto2)", fontSize: 12 }}
                width={64}
              />
              <Tooltip
                formatter={(v) =>
                  v <= PISO * 1.01
                    ? "≈ 0 (< 1e-6 mHa)"
                    : `${Number(v).toFixed(4)} mHa`
                }
                labelFormatter={(l) => `Distancia: ${Number(l).toFixed(2)} Å`}
                cursor={{ stroke: "var(--acento)", strokeDasharray: "4 4" }}
                contentStyle={{
                  background: "var(--panel)",
                  border: "1px solid var(--borde)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                  padding: "10px 12px",
                }}
              />
              <ReferenceLine
                y={UMBRAL}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{
                  value: "precisión química (1.6 mHa)",
                  fill: "var(--texto2)",
                  fontSize: 11,
                  position: "insideTopLeft",
                }}
              />
              <ReferenceLine
                x={fila.distancia_A}
                stroke="var(--acento)"
                strokeDasharray="4 3"
              />
              <Line
                name="Hartree-Fock"
                dataKey="eHF"
                stroke={COL.hf}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
                hide={!seriesVisibles.hf}
                isAnimationActive={false}
              />
              <Line
                name="VQE UCCSD"
                dataKey="eUCC"
                stroke={COL.ucc}
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                hide={!seriesVisibles.ucc}
                isAnimationActive={false}
              />
              <Line
                name="VQE RealAmplitudes"
                dataKey="eRA"
                stroke={COL.ra}
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                hide={!seriesVisibles.ra}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="nota">
          Los errores menores a 10⁻⁶ mHa se dibujan en 10⁻⁶ para poder
          mostrarlos en escala logarítmica.
        </p>
      </section>

      <section className="panel grafica grafica-costo">
        <div className="grafica-cabecera">
          <div>
            <h2>Costo de optimización</h2>
            <p className="nota">
              Evaluaciones de energía por distancia interatómica.
            </p>
          </div>
          <span className="unidad-grafica">evaluaciones</span>
        </div>
        <div className="graf">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={serie}
              margin={{ top: 8, right: 16, bottom: 20, left: 8 }}
              onClick={seleccionarDistanciaEnGrafica}
              accessibilityLayer
            >
              <CartesianGrid stroke="var(--rejilla)" vertical={false} />
              <XAxis
                dataKey="d"
                type="number"
                domain={["dataMin", "dataMax"]}
                tickFormatter={(v) => v.toFixed(1)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--texto2)", fontSize: 12 }}
                label={{
                  value: "Distancia interatómica (Å)",
                  position: "insideBottom",
                  offset: -10,
                  fill: "var(--texto2)",
                  fontSize: 12,
                }}
              />
              <YAxis
                scale="log"
                domain={[50, 5000]}
                allowDataOverflow
                ticks={[100, 300, 1000, 3000]}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--texto2)", fontSize: 12 }}
                width={64}
              />
              <Tooltip
                formatter={(v) => Number(v).toLocaleString("es-MX")}
                labelFormatter={(l) => `Distancia: ${Number(l).toFixed(2)} Å`}
                cursor={{ stroke: "var(--acento)", strokeDasharray: "4 4" }}
                contentStyle={{
                  background: "var(--panel)",
                  border: "1px solid var(--borde)",
                  borderRadius: 10,
                  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.12)",
                  padding: "10px 12px",
                }}
              />
              <ReferenceLine
                y={2000}
                stroke={COL.ucc}
                strokeDasharray="2 4"
                label={{
                  value: "límite UCCSD (2,000)",
                  fill: "var(--texto2)",
                  fontSize: 11,
                  position: "insideBottomRight",
                }}
              />
              <ReferenceLine
                y={3000}
                stroke={COL.ra}
                strokeDasharray="2 4"
                label={{
                  value: "límite RealAmp. (3,000)",
                  fill: "var(--texto2)",
                  fontSize: 11,
                  position: "insideTopRight",
                }}
              />
              <ReferenceLine
                x={fila.distancia_A}
                stroke="var(--acento)"
                strokeDasharray="4 3"
              />
              <Line
                name="UCCSD"
                dataKey="nUCC"
                stroke={COL.ucc}
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                hide={!seriesVisibles.ucc}
                isAnimationActive={false}
              />
              <Line
                name="RealAmplitudes (mejor de 3 semillas)"
                dataKey="nRA"
                stroke={COL.ra}
                dot={{ r: 3 }}
                activeDot={{ r: 6, strokeWidth: 2 }}
                hide={!seriesVisibles.ra}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="nota">
          El límite fue de 2,000 evaluaciones para UCCSD y de 3,000 para
          RealAmplitudes: los puntos que tocan esas líneas se detuvieron por el
          límite, no porque el optimizador convergiera.
        </p>
      </section>
      </div>

      <details className="panel regla">
        <summary>
          <span>Guía de decisión del estudio</span>
          <span className="detalle-ayuda">Ver criterios y limitaciones</span>
        </summary>
        <div className="contenido-regla">
          <ol>
            <li>
              Calcular siempre Hartree-Fock y FCI como referencia. Si HF ya queda
              dentro de 1.6 mHa, el VQE no aporta mejora significativa.
            </li>
            <li>
              Con correlación fuerte (HF fuera del umbral), usar un ansatz con
              base química como UCCSD: cumplió el umbral en los 34 puntos.
            </li>
            <li>
              Usar RealAmplitudes solo con varias semillas y verificando contra
              una referencia: en LiH llegó a 42.05 mHa de error.
            </li>
            <li>
              Revisar si el optimizador terminó por convergencia o por límite de
              iteraciones.
            </li>
          </ol>
          <p className="nota">
            Guía preliminar basada en dos moléculas pequeñas, simulación sin ruido
            y base STO-3G (LiH con espacio activo de 2 electrones y 3 orbitales).
            No demuestra ventaja cuántica ni aplica a sistemas grandes.
          </p>
        </div>
      </details>

      <footer className="pie">
        Reporte técnico · Universidad Autónoma de Tamaulipas · Facultad de
        Ingeniería Tampico
      </footer>
    </main>
  );
}
