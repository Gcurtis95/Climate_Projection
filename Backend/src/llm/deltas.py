"""
Pre-computes human-readable deltas from raw EE band output.
Passed to every LLM call so models never have to do arithmetic.
"""

TEMP_BANDS = {"tas", "tasmin", "tasmax"}
BANDS = ["tas", "tasmin", "tasmax", "pr", "hurs", "sfcWind"]


def compute_deltas(projections: dict) -> dict:
    """
    Returns a dict keyed by band name. Each entry contains:
      - baseline / projected values in display units
      - absolute or percentage delta
      - std dev
      - plain-English direction word
    Returns an empty dict for any band missing from projections.
    """
    deltas: dict = {}

    for band in BANDS:
        projected = projections.get(f"{band}_mean")
        baseline = projections.get(f"{band}_baseline")
        std = projections.get(f"{band}_std")

        if projected is None or baseline is None:
            continue

        abs_delta = projected - baseline

        if band in TEMP_BANDS:
            deltas[band] = {
                "baseline_C": round(baseline - 273.15, 1),
                "projected_C": round(projected - 273.15, 1),
                "delta_C": round(abs_delta, 2),
                "std_K": round(std, 2) if std is not None else None,
                "direction": "warmer" if abs_delta > 0 else "cooler",
            }

        elif band == "pr":
            pct = (abs_delta / baseline * 100) if baseline else 0
            std_pct = (std / baseline * 100) if (std is not None and baseline) else None
            deltas[band] = {
                "baseline_kg_m2_s": round(baseline, 7),
                "projected_kg_m2_s": round(projected, 7),
                "delta_pct": round(pct, 1),
                "std_pct_of_baseline": round(std_pct, 1) if std_pct is not None else None,
                "direction": "wetter" if abs_delta > 0 else "drier",
            }

        elif band == "hurs":
            deltas[band] = {
                "baseline_pct": round(baseline, 1),
                "projected_pct": round(projected, 1),
                "delta_pct": round(abs_delta, 1),
                "std_pct": round(std, 1) if std is not None else None,
                "direction": "more humid" if abs_delta > 0 else "drier",
            }

        elif band == "sfcWind":
            deltas[band] = {
                "baseline_m_s": round(baseline, 2),
                "projected_m_s": round(projected, 2),
                "delta_m_s": round(abs_delta, 2),
                "std_m_s": round(std, 2) if std is not None else None,
                "direction": "windier" if abs_delta > 0 else "calmer",
            }

    return deltas


def format_delta_brief(deltas: dict) -> str:
    """
    Returns a compact, LLM-readable table of the key anomalies, e.g.:

      tas:     ▲2.4°C  (baseline 12.3°C → projected 14.7°C, σ=1.8K)
      pr:      ▼18.3%  precipitation change  (σ=45.2% of baseline)
      hurs:    ▼4.2%   relative humidity  (σ=3.1%)
      sfcWind: ▲0.31 m/s wind speed  (σ=0.18 m/s)
    """
    lines = []

    for band in BANDS:
        info = deltas.get(band)
        if info is None:
            continue

        arrow = "▲" if info["direction"] in ("warmer", "wetter", "more humid", "windier") else "▼"

        if band in TEMP_BANDS:
            sig = f"σ={info['std_K']}K" if info.get("std_K") is not None else ""
            lines.append(
                f"  {band:<8} {arrow}{abs(info['delta_C']):.1f}°C  "
                f"(baseline {info['baseline_C']:.1f}°C → projected {info['projected_C']:.1f}°C"
                + (f", {sig}" if sig else "") + ")"
            )

        elif band == "pr":
            sig = f"σ={info['std_pct_of_baseline']:.1f}% of baseline" if info.get("std_pct_of_baseline") is not None else ""
            base_mm = info['baseline_kg_m2_s'] * 86400
            proj_mm = info['projected_kg_m2_s'] * 86400
            lines.append(
                f"  {band:<8} {arrow}{abs(info['delta_pct']):.1f}%  precipitation change"
                f"  (baseline {base_mm:.2f} mm/day → projected {proj_mm:.2f} mm/day"
                + (f", {sig}" if sig else "") + ")"
            )

        elif band == "hurs":
            sig = f"σ={info['std_pct']:.1f}%" if info.get("std_pct") is not None else ""
            lines.append(
                f"  {band:<8} {arrow}{abs(info['delta_pct']):.1f}%  relative humidity"
                + (f"  ({sig})" if sig else "")
            )

        elif band == "sfcWind":
            sig = f"σ={info['std_m_s']:.2f} m/s" if info.get("std_m_s") is not None else ""
            lines.append(
                f"  {band:<8} {arrow}{abs(info['delta_m_s']):.2f} m/s  wind speed"
                + (f"  ({sig})" if sig else "")
            )

    return "\n".join(lines) if lines else "No delta data available."
