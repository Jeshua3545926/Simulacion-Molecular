import sys
import time
import warnings
import numpy as np
import pandas as pd
from qiskit.circuit.library import real_amplitudes
from qiskit.quantum_info import Statevector
from qiskit_nature.second_q.circuit.library import HartreeFock, UCCSD
from qiskit_nature.second_q.drivers import PySCFDriverp
from qiskit_nature.second_q.mappers import JordanWignerMapper
from qiskit_nature.second_q.transformers import ActiveSpaceTransformer
from scipy.optimize import minimize

warnings.filterwarnings("ignore")


if len(sys.argv) < 2:
    raise SystemExit("Uso: python run_vqe.py <H2|LiH>")

mol = sys.argv[1]

if mol == "H2":
    dists = [round(0.3 + 0.1 * i, 1) for i in range(23)]
    atom = lambda d: f"H 0 0 0; H 0 0 {d}"
    transformer = None
else:
    dists = [round(1.0 + 0.25 * i, 2) for i in range(11)]
    atom = lambda d: f"Li 0 0 0; H 0 0 {d}"
    transformer = ActiveSpaceTransformer(2, 3)

mapper = JordanWignerMapper()
rows = []

for d in dists:
    driver = PySCFDriver(
        atom=atom(d),
        basis="sto3g",
        unit=__import__("qiskit_nature.units", fromlist=["DistanceUnit"]).DistanceUnit.ANGSTROM,
    )
    prob = driver.run()
    e_scf = prob.reference_energy

    if transformer is not None:
        prob = transformer.transform(prob)

    ham = prob.hamiltonian
    const = sum(ham.constants.values())
    op = mapper.map(ham.second_q_op())
    H = op.to_matrix(sparse=True)
    nq = op.num_qubits
    nelec = sum(prob.num_particles)

    idx = [i for i in range(2**nq) if bin(i).count("1") == nelec]
    Hs = H[idx][:, idx].toarray()
    e_fci = np.linalg.eigvalsh(Hs)[0] + const

    hf = HartreeFock(prob.num_spatial_orbitals, prob.num_particles, mapper)

    def energy_of(circuit):
        def f(x):
            f.n += 1
            sv = Statevector(circuit.assign_parameters(x)).data
            return float(np.real(sv.conj() @ (H @ sv)))

        f.n = 0
        return f

    e_hf = float(np.real(Statevector(hf).data.conj() @ (H @ Statevector(hf).data))) + const

    uccsd = UCCSD(prob.num_spatial_orbitals, prob.num_particles, mapper, initial_state=hf)
    f = energy_of(uccsd)
    t0 = time.time()
    result = minimize(
        f,
        np.zeros(uccsd.num_parameters),
        method="COBYLA",
        tol=1e-9,
        options={"maxiter": 2000},
    )
    t_u = time.time() - t0
    e_u = result.fun + const
    n_u = f.n
    p_u = uccsd.num_parameters

    ra = real_amplitudes(nq, reps=2, entanglement="linear")
    full = hf.copy()
    full.compose(ra, inplace=True)

    best = None
    t_r = 0.0
    for seed in range(3):
        rng = np.random.default_rng(seed)
        f = energy_of(full)
        t0 = time.time()
        rr = minimize(
            f,
            rng.normal(0, 0.1, full.num_parameters),
            method="COBYLA",
            tol=1e-9,
            options={"maxiter": 3000},
        )
        t_r += time.time() - t0
        if best is None or rr.fun < best[0]:
            best = (rr.fun, f.n)

    e_r = best[0] + const
    n_r = best[1]

    row = {
        "molecula": mol,
        "distancia_A": d,
        "qubits": nq,
        "parametros_uccsd": p_u,
        "parametros_ra": full.num_parameters,
        "E_SCF": e_scf,
        "E_HF": e_hf,
        "E_FCI": e_fci,
        "E_VQE_UCCSD": e_u,
        "E_VQE_RealAmp": e_r,
        "err_HF_mHa": (e_hf - e_fci) * 1000,
        "err_VQE_UCCSD_mHa": (e_u - e_fci) * 1000,
        "err_VQE_RealAmp_mHa": (e_r - e_fci) * 1000,
        "E_corr_mHa_FCI_menos_HF": (e_fci - e_hf) * 1000,
        "evals_uccsd": n_u,
        "evals_ra": n_r,
        "t_uccsd_s": t_u,
        "t_ra_s": t_r,
    }
    rows.append(row)

    print(
        mol,
        d,
        row["err_HF_mHa"],
        row["err_VQE_UCCSD_mHa"],
        row["err_VQE_RealAmp_mHa"],
        flush=True,
    )
    pd.DataFrame(rows).to_csv(f"datos_{mol}.csv", index=False)
