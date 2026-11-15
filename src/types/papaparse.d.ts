declare module "papaparse" {
  export type ParseError = {
    type: string;
    code: string;
    message: string;
    row?: number;
  };

  export type ParseMeta = {
    fields?: string[];
  };

  export type ParseResult<T> = {
    data: T[];
    errors: ParseError[];
    meta: ParseMeta;
  };

  export type ParseConfig = {
    header?: boolean;
    dynamicTyping?: boolean;
    skipEmptyLines?: boolean | "greedy";
  };

  const Papa: {
    parse<T>(input: string, config?: ParseConfig): ParseResult<T>;
  };

  export default Papa;
}