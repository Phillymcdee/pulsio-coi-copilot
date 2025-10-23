# PARSER_SKELETON

```ts
// server/services/coiParser.ts
export type CoverageLine = { type: "GL"|"AUTO"|"WC"|"UMBRELLA"; limit?: number };
export type ParsedCOI = {
  insured?: string;
  policyNumber?: string;
  effective?: string; // ISO date string
  expires?: string;   // ISO date string
  lines: CoverageLine[];
  additionalInsured?: boolean;
  waiver?: boolean;
  rawText?: string;
};

export async function parseCOI(buffer: Buffer): Promise<ParsedCOI> {
  const text = await ocrToText(buffer); // wrap tesseract/pdf extraction
  return {
    insured: extractInsured(text),
    policyNumber: extractPolicy(text),
    effective: extractDate(text, /effective date|eff\.?\s*date|policy period.*from\s*(\w+\s+\d{1,2},?\s+\d{4})/i),
    expires: extractDate(text, /expiration|expiry|to\s*(\w+\s+\d{1,2},?\s+\d{4})/i),
    lines: [
      { type: "GL", limit: extractLimit(text, /(commercial\s+general\s+liability|CGL)[\s\S]*?(\$?[0-9,\.]+)/i) },
      { type: "AUTO", limit: extractLimit(text, /(automobile|auto\s*liability)[\s\S]*?(\$?[0-9,\.]+)/i) }
    ].filter(l => l.limit),
    additionalInsured: /additional\s+insured[:\s]*yes|addi?\.?\s*ins/i.test(text),
    waiver: /(waiver\s+of\s+subrogation|subrogation\s+waived)/i.test(text),
    rawText: text
  };
}
```
