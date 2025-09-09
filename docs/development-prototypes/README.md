# Development Prototypes

This directory contains prototype files and development experiments that are not part of the production codebase.

## Files

### `backend-radical-search.js`
- **Purpose**: Early prototype for RadicalPosition-based search system
- **Status**: Replaced by production implementation in `routes/api.js`
- **Contains**: Template code for `/radical-search` endpoint
- **Note**: This was a development file, never integrated into the main application

## Production Implementation

The RadicalPosition search system is fully implemented in production via:
- `routes/api.js` - All search endpoints  
- `src/services/apiService.js` - Frontend API integration
- `src/components/graph/Search.js` - UI components

See `CLAUDE.md` for complete architecture documentation.