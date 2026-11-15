import type { SupportedUploadKind } from "@/types/research";
import type { TabularDataset } from "./tabular";

export type ParsedUploadContext = {
  name: string;
  kind: SupportedUploadKind;
  sizeBytes: number;
  warnings: string[];
  contextText: string;
  summary: string;
  tabularDatasets: TabularDataset[];
};

export type ParsedUploadFailure = {
  name: string;
  sizeBytes: number;
  error: string;
};