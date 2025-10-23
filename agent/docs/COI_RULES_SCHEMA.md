# COI_RULES_SCHEMA

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "COIRules",
  "type": "object",
  "properties": {
    "minGL": { "type": "number", "minimum": 0 },
    "minAuto": { "type": "number", "minimum": 0 },
    "requireAdditionalInsured": { "type": "boolean" },
    "requireWaiver": { "type": "boolean" },
    "expiryWarningDays": {
      "type": "array",
      "items": { "type": "integer", "minimum": 1 },
      "default": [30,14,7]
    }
  },
  "required": ["minGL"],
  "additionalProperties": true
}
```

### Example
```json
{
  "minGL": 2000000,
  "minAuto": 1000000,
  "requireAdditionalInsured": true,
  "requireWaiver": false,
  "expiryWarningDays": [30,14,7]
}
```
