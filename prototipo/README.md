# Dashboard: simulación molecular con VQE (H₂ y LiH)

Muestra las 34 simulaciones del estudio
(sin ruido, base STO-3G): curvas de energía, error contra FCI en escala logarítmica,
costo en evaluaciones y un modelo 3D que se estira con la distancia.

## Cómo correrlo
    npm install
    npm run dev          # desarrollo, en http://localhost:5173
    npm run build        # genera la carpeta dist/
    npm run preview      # sirve dist/ en local

## Datos
`src/datos.json` es el contenido de `base_de_datos_vqe.csv` (mismas columnas y valores).
Si se repiten los cálculos, se reemplaza ese archivo y la página se actualiza sola.

## Estructura
- `src/App.jsx`: controles, tabla, gráficas (Recharts) y regla de decisión.
- `src/Molecula3D.jsx`: visor 3D con 3Dmol.js.
- `src/styles.css`: estilos con modo claro y oscuro.
