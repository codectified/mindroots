# MindRoots Documentation Index

**Last Updated**: September 12, 2025  
**Purpose**: Comprehensive navigation guide for all MindRoots documentation

---

## 📋 Quick Navigation

### **Core Architecture & Setup**
- **[CLAUDE.md](../CLAUDE.md)** - Main architecture reference and Claude's knowledge base
- **[README.md](../README.md)** - Project overview and getting started guide

### **Frontend Design & Development**
- **[Frontend Design Guide](FRONTEND-DESIGN-GUIDE.md)** - Comprehensive guide to frontend architecture, layout patterns, flexbox alignment, styling conventions, and common pitfalls
- **[Component Patterns](COMPONENT-PATTERNS.md)** - Reusable component patterns, code examples, and best practices for lists, headers, selectors, modals, and forms

### **Feature Documentation**
- **[Analysis Nodes](features/ANALYSIS-NODES-DOCUMENTATION.md)** - LLM-generated linguistic analysis system with v2 schema
- **[Corpus Navigation System](features/CORPUS-NAVIGATION-SYSTEM.md)** - ✅ Fixed navigation with global_position for reliable sequential corpus browsing
- **[Node Inspector](features/NODE-INSPECTOR-DOCUMENTATION.md)** - Comprehensive node inspection with properties and relationships
- **[Radical Search Integration](features/RADICAL-SEARCH-INTEGRATION.md)** - RadicalPosition-based search system architecture
- **[Validation System](features/VALIDATION-SYSTEM-DOCUMENTATION.md)** - Inline editing and approval workflow for linguistic data

### **Testing & Quality Assurance**
- **[Backend Test Results](testing/BACKEND-TEST-RESULTS.md)** - API endpoint testing and validation results
- **[Frontend Integration Checklist](testing/FRONTEND-INTEGRATION-CHECKLIST.md)** - UI/UX testing procedures
- **[Search System Tests](testing/RADICAL-SEARCH-TESTS.md)** - Comprehensive search functionality validation

### **Archived & Historical**
- **[Backend Deduplication Fixes](archived/BACKEND-DEDUPLICATION-FIXES.md)** - Historical database optimization work
- **[UI Overhaul Notes](archived/UI-OVERHAUL-NOTES.md)** - Context menu redesign and InfoBubble enhancement history
- **[Security Implementation](archived/SECURITY-IMPLEMENTATION.md)** - GPT API key security system development

### **Development Prototypes**
- **[Experimental Features](development-prototypes/)** - Unused code, experiments, and proof-of-concepts

---

## 📁 Documentation Organization

### **File Naming Convention**
- **Features**: `FEATURE-NAME-DOCUMENTATION.md` (uppercase with hyphens)
- **Testing**: `TEST-TYPE-RESULTS.md` or `COMPONENT-TESTING.md`
- **Historical**: `FEATURE-DEPLOYMENT-NOTES.md` or `SYSTEM-CHANGES.md`

### **Directory Structure**
```
docs/
├── DOCUMENTATION-INDEX.md          # This file - navigation hub
├── features/                       # Current feature documentation
│   ├── ANALYSIS-NODES-DOCUMENTATION.md
│   ├── RADICAL-SEARCH-INTEGRATION.md
│   ├── VALIDATION-SYSTEM-DOCUMENTATION.md
│   └── NODE-INSPECTOR-DOCUMENTATION.md
├── testing/                        # Test procedures and results  
│   ├── BACKEND-TEST-RESULTS.md
│   ├── FRONTEND-INTEGRATION-CHECKLIST.md
│   └── RADICAL-SEARCH-TESTS.md
├── archived/                       # Deployed/historical documentation
│   ├── BACKEND-DEDUPLICATION-FIXES.md
│   ├── UI-OVERHAUL-NOTES.md
│   └── SECURITY-IMPLEMENTATION.md
└── development-prototypes/         # Experimental and unused code
```

---

## 🎯 Documentation Categories

### **Current Active Features** (docs/features/)
Documentation for features currently in development or recently deployed. These documents are actively maintained and updated.

**Guidelines:**
- Include implementation details with file paths and line numbers
- Provide testing steps and verification procedures  
- Document API endpoints and database schema changes
- Include troubleshooting sections for common issues

### **Testing Documentation** (docs/testing/)
Test procedures, results, and validation checklists for ensuring code quality and functionality.

**Guidelines:**
- Document test commands and expected outputs
- Include both manual and automated testing procedures
- Provide verification steps for production deployment
- Record test results and any issues discovered

### **Archived Documentation** (docs/archived/)
Documentation for features that are deployed, stable, and no longer under active development. Kept for historical reference and troubleshooting.

**Guidelines:**
- Move feature documentation here after successful production deployment
- Include final implementation status and lessons learned
- Maintain for troubleshooting and future reference
- Add deployment date and final status

### **Development Prototypes** (docs/development-prototypes/)
Experimental code, unused implementations, and proof-of-concept work that may be referenced in the future.

**Guidelines:**
- Document experimental approaches and findings
- Include code that was developed but not implemented
- Provide context for why approaches were or weren't adopted
- Useful for future feature development reference

---

## 🔍 Search and Navigation Tips

### **Finding Specific Information**
- **Architecture Questions**: Start with [CLAUDE.md](../CLAUDE.md)
- **Feature Implementation**: Check `docs/features/` directory
- **Testing Procedures**: Look in `docs/testing/` directory
- **Historical Context**: Search `docs/archived/` directory

### **Cross-References**
Most documents include "See Also" sections linking to related documentation. Follow these links for comprehensive understanding of interconnected systems.

### **File Search Commands**
```bash
# Search all documentation for specific terms
grep -r "search-term" docs/

# Find files by name pattern
find docs/ -name "*SEARCH*"

# List all feature documentation
ls docs/features/
```

---

## 📝 Documentation Standards

### **Required Sections for Feature Documents**
1. **Overview** - Brief description and purpose
2. **Implementation Details** - Technical implementation with file paths
3. **API Endpoints** - If applicable, with examples
4. **Database Schema** - If database changes involved
5. **Frontend Integration** - UI/UX implementation details
6. **Testing and Validation** - How to verify functionality
7. **Troubleshooting** - Common issues and solutions

### **Header Template**
```markdown
# Feature Name Documentation

**Date Added**: [Date]
**Status**: [Development/Testing/Production-Ready]
**Impact**: [Brief description of what this affects]

## Overview
[Feature description and purpose]

## Implementation Details
**Files Changed**: 
- `path/to/file.js` (lines X-Y) - Description of changes
- `path/to/other.js` (entire file) - Description of changes

[Additional sections as needed]
```

### **Cross-Reference Format**
```markdown
**See Also**: 
- [Related Feature](OTHER-FEATURE-DOCUMENTATION.md)
- [Testing Guide](../testing/FEATURE-TESTING.md)
- [Architecture Overview](../CLAUDE.md#relevant-section)
```

---

## 🚀 For Developers

### **Adding New Documentation**
1. **Check this index first** - avoid duplicating existing documentation
2. **Choose appropriate directory** based on documentation type
3. **Follow naming conventions** - uppercase with hyphens for features
4. **Update this index** - add entry with brief description
5. **Add cross-references** - link to related documentation

### **Updating Existing Documentation**
1. **Update file content** with new information
2. **Update "Last Updated" date** in document header
3. **Add "See Also" references** if new relationships created
4. **Update this index** if document purpose changes

### **Moving Documentation**
1. **Update all cross-references** in other documents
2. **Update this index** with new location
3. **Consider keeping redirect note** in old location temporarily

---

## 🔗 External Resources

### **MindRoots Application**
- **Production**: https://theoption.life
- **Local Development**: http://localhost:3000
- **Backend API**: https://theoption.life/api (production) or http://localhost:5001/api (local)

### **Database and Tools**
- **Neo4j Database**: Graph database for morphological relationships
- **PM2 Process Manager**: Production process management
- **React Development**: Frontend framework documentation

---

**💡 Tip**: When working on a feature, always check if documentation already exists in this index before creating new files. This prevents duplication and ensures you're building on existing knowledge.