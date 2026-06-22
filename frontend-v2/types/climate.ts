export type Season = "Winter" | "Spring" | "Summer" | "Autumn";

export type ProjectionQuery = {
  lon: number;
  lat: number;
  season: Season;
  year: number;
};

export type PrecheckResult = {
  isWater: boolean;
  address: string | null;
};

export type DisplayFormat =
  | "number"
  | "scientific"
  | "percent"
  | "celsius"
  | "kelvin"
  | "w_m2"
  | "m_s"
  | "kg_m2_s"
  | "mm_day";

export type ValueWithOptionalRaw = {
  value: number;
  raw_value?: number;
  raw_unit?: string;
};

export type ClimateTableRow = {
  key: string;
  label: string;
  unit: string;
  baseline: ValueWithOptionalRaw;
  projected: ValueWithOptionalRaw;
  display_format?: DisplayFormat;
};

export type Citation = {
  title: string;
  doi?: string;
  url?: string;
};

export type ShaderParams = {
  /** 0=cold/polar, 0.5=temperate, 1=hot/tropical */
  warmth: number;
  /** 0=calm/stable, 1=stormy/highly variable */
  turbulence: number;
  /** 0=wet/humid, 1=arid/dry */
  aridity: number;
};

export type ClimateSummary = {
  title: string;
  model_name?: string;
  overview: {
    summary: string;
    key_takeaways: string[];
  };
  location: {
    country_region: string;
    lat: number;
    lon: number;
    name: string;
  };
  impacts: {
    bullets: string[];
  };
  data_table: ClimateTableRow[];
  citations?: Citation[];
  shader_params?: ShaderParams;
};
