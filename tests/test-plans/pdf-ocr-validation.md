# PDF OCR Validation Test Plan

## Objective
Validate that the OCR system can accurately extract expiry dates from real-world ACORD 25 PDFs and other COI formats used by major insurance companies.

## Test Categories

### 1. ACORD 25 Digital PDFs (Priority: CRITICAL)
**Source:** Download real ACORD 25 samples from:
- State Farm contractor portal
- Allstate business insurance
- Liberty Mutual certificates
- Hartford insurance documents

**Test Cases:**
- [ ] Clean digital PDF (text-based)
- [ ] Mixed digital/image PDF
- [ ] Multi-page ACORD with coverage schedules
- [ ] ACORD with additional endorsements

### 2. ACORD 25 Scanned PDFs (Priority: HIGH)
**Source:** Scanned/photographed versions of ACORD certificates

**Test Cases:**
- [ ] High-quality scan (300+ DPI)
- [ ] Medium-quality scan (150-200 DPI)
- [ ] Poor-quality scan (< 150 DPI)
- [ ] Rotated/skewed documents
- [ ] Faded or low-contrast documents

### 3. Non-ACORD COI Formats (Priority: MEDIUM)
**Source:** Insurance companies that use proprietary formats

**Test Cases:**
- [ ] Progressive COI PDF
- [ ] Custom insurance company templates
- [ ] Older ACORD versions (pre-2016)
- [ ] International insurance formats

### 4. Edge Cases (Priority: MEDIUM)
**Test Cases:**
- [ ] Password-protected PDFs
- [ ] Corrupted/incomplete PDFs
- [ ] PDFs with watermarks/stamps
- [ ] Multi-language COIs

## Success Criteria
- **95% accuracy** on digital ACORD 25 PDFs
- **85% accuracy** on high-quality scanned PDFs
- **70% accuracy** on medium-quality scanned PDFs
- **Graceful fallback** on failed extractions (1-year default)

## Implementation Priority
**Phase 1 (Essential):** Digital ACORD 25 testing
**Phase 2 (Important):** Scanned PDF validation
**Phase 3 (Nice-to-have):** Edge case handling

## Resources Needed
- Real ACORD 25 PDFs from 3-5 major insurers
- Test contractor account access to insurance portals
- Performance benchmarking tools for OCR processing time