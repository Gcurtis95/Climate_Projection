'use client'

import styles from './style.module.css'

export type ClimateTableRow = {
  key: string;
  label: string;
  unit: string;
  display_format?: "kelvin" | "percent" | "scientific" | "w_m2" | "m_s";
  baseline: { value: number };
  projected: { value: number };
};


type Props = {
  rows: ClimateTableRow[];
};

export function ClimateDataTable({ rows }: Props) {
  return (
    <div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Variable</th>
            <th className={styles.th}>Baseline</th>
            <th className={styles.th}>Projected</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            return (
              <tr key={row.key}>
                <td className={styles.td}>
                  <strong>{row.label}</strong>
                </td>

                <td className={styles.td}>
                  {formatValue(
                    row.baseline.value,
                    row.unit,
                    row.display_format
                  )}
                </td>

                <td className={styles.td}>
                  {formatValue(
                    row.projected.value,
                    row.unit,
                    row.display_format
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatValue(
  value: number,
  unit: string,
  format?: ClimateTableRow["display_format"]
) {
  switch (format) {
    case "kelvin":

      return `${(value - 273.15).toFixed(1)} °C`;

    case "percent":
      return `${value.toFixed(1)} %`;

    case "scientific":
      return value.toExponential(2);

    case "w_m2":
      return `${value.toFixed(1)} W/m²`;

    case "m_s":
      return `${value.toFixed(1)} m/s`;

    default:
      return `${value.toFixed(4)} ${unit}`;
  }
}
