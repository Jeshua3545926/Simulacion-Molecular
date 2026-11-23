"""
juntar_csv.py — Genera base_de_datos_vqe.csv a partir de datos_H2.csv y datos_LiH.csv.

JUSTIFICACIÓN
-------------
El script principal (Evaluación_del_algoritmo_cuántico_variacional.py) solo puede
procesar una molécula por ejecución, por lo que produce archivos separados:
datos_H2.csv y datos_LiH.csv. Para el análisis comparativo entre moléculas se
necesita un único archivo consolidado. Este script automatiza esa unión para que
no haya que hacerlo manualmente cada vez que se regeneren los datos.
"""

import pandas as pd
from pathlib import Path

archivos = ["datos_H2.csv", "datos_LiH.csv"]
existentes = [f for f in archivos if Path(f).exists()]

if not existentes:
    raise SystemExit("No se encontró ningún archivo (datos_H2.csv ni datos_LiH.csv).")

if len(existentes) < len(archivos):
    faltantes = set(archivos) - set(existentes)
    print(f"Advertencia: no se encontraron {faltantes}, se combinará solo con {existentes}.")

df = pd.concat([pd.read_csv(f) for f in existentes], ignore_index=True)
df.to_csv("base_de_datos_vqe.csv", index=False)

print(f"base_de_datos_vqe.csv generado con {len(df)} filas ({', '.join(existentes)}).")
