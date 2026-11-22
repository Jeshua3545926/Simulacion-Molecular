# Dashboard: simulación molecular con VQE (H₂ y LiH)

Muestra las 34 simulaciones del estudio
(sin ruido, base STO-3G): curvas de energía, error contra FCI en escala logarítmica,
costo en evaluaciones y un modelo 3D que se estira con la distancia.

## Cómo correrlo
    1. cd prototipo
    2. npm install
    3. npm run dev          # desarrollo, en http://localhost:5173

para poder correr la aplicacion web local se necesita tener instalado Node Js junto con npm.
Sin embargo como entendemos que muchas veces no es posible instalar esas herramientas para ejecutarlo localmente por falta de almacenaminto del equipo o incluso por tiempo decidimos subir la aplicacion web a internet, este es el link 

[Experimento-Web](https://prototipo2-nine.vercel.app/)

## Datos
`src/datos.json` es el contenido de `base_de_datos_vqe.csv` (mismas columnas y valores).
Si se repiten los cálculos, se reemplaza ese archivo y la página se actualiza sola.

## Estructura
- `src/App.jsx`: controles, tabla, gráficas (Recharts) y regla de decisión.
- `src/Molecula3D.jsx`: visor 3D con 3Dmol.js.
- `src/styles.css`: estilos con modo claro y oscuro.
