# GPT Root Analysis API Reference

## 🎯 Purpose
Create structured Analysis nodes for Arabic morphological roots using the MindRoots database.

## 🔑 Authentication
```
Authorization: Bearer [PUBLIC_GPT_API_KEY]
Content-Type: application/json
```

## 📡 Endpoints

### Read Existing Analyses
```bash
POST https://theoption.life/api/execute-query
{
  "query": "MATCH (r:Root)-[:HAS_ANALYSIS]->(a:Analysis) WHERE r.root_id = 123 RETURN a.version, a.lexical_summary, a.semantic_path ORDER BY a.version DESC LIMIT 1"
}
```

### Create New Analysis
```bash
POST https://theoption.life/api/write-root-analysis
{
  "rootId": "123",
  "lexical_summary": "Required: Core meanings and concrete origins",
  "semantic_path": "Optional: Path from concrete to abstract meanings", 
  "fundamental_frame": "Optional: Underlying semantic frameworks",
  "words_expressions": "Optional: Related words and expressions",
  "poetic_references": "Optional: Literary and idiomatic usage examples",
  "basic_stats": "Optional: Quantitative analysis of word family"
}
```

## 📋 Analysis Structure Template

```
📜 Lexical Summary
Concrete origin
    • [primary meaning] — "[definition and usage context]"
    • [relationship to other concepts]

Path to abstraction  
    • From [concrete meaning] to [abstract meaning]
    • Through [morphological process] → "[derived meaning]"
    • Semantic shift based on: [explanation]

Fundamental frame
    • [Conceptual framework]: [description]
    • [Temporal/spatial dynamics]: [description]

⸻

✒️ Words & Expressions Relevant to "[Theme]"
    • [word] — "[meaning and context]" 
    • [expression] — "[usage and meaning]"

⸻

📖 Poetic & Idiomatic References  
    • On [topic]: [Arabic] — "[translation]"
    • On [topic]: [Arabic] — "[translation]"

⸻

📊 Basic Stats
    • Total Word Nodes under [root]: [number]
    • [Morphological categories and examples]
```

## 🔄 Workflow

1. **Check Existing**: Query for existing analyses to avoid repetition
2. **Generate Sections**: Create structured content using template
3. **Submit**: POST to `/write-root-analysis` endpoint
4. **Version Control**: System auto-increments version numbers
5. **Build Iteratively**: Reference previous analyses for improvements

## 📌 Required Fields
- `rootId` - Target root identifier
- `lexical_summary` - Core analysis (required)

## 🏷️ Optional Fields
- `semantic_path` - Meaning development
- `fundamental_frame` - Conceptual frameworks  
- `words_expressions` - Related vocabulary
- `poetic_references` - Literary examples
- `basic_stats` - Quantitative data
- `version` - Override auto-versioning

## ✅ Response
```json
{
  "success": true,
  "analysisId": "analysis_123_timestamp",
  "version": 2,
  "sections": {
    "lexical_summary": true,
    "semantic_path": true,
    "words_expressions": false
  }
}
```

## 🚫 Security Notes
- Only read-only queries allowed on `/execute-query`
- Only Analysis node creation allowed on `/write-root-analysis` 
- Root node validation prevents invalid targets
- IP logging for audit trails