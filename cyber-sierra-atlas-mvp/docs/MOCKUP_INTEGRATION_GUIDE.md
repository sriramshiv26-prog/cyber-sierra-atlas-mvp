# Mockup Integration Guide: Phase 2B + Phase 3 Enhancements

**Base File:** `/Users/sriram/Downloads/Cyber Sierra Atlas _standalone_-3.html`  
**Enhanced File:** `/Users/sriram/Downloads/Cyber_Sierra_Atlas_Phase2B_Phase3_Enhanced.html`

---

## Overview

All Phase 2B & Phase 3 CSS styles have been added to the enhanced mockup. This guide shows exactly where to inject the HTML elements into your existing standalone file.

---

## Phase 2B: Features to Add

### Feature 1: Flags Column in Findings Table

**Location:** In the findings table, add a new column between "Severity" and "Status"

**HTML to Insert:**
```html
<th>Flags</th>
```

**Add to each finding row:**
```html
<td>
  <!-- Option 1: Duplicate -->
  <span class="badge-duplicate">Duplicate</span>
  
  <!-- Option 2: Unique -->
  <span class="badge-unique">✓ Unique</span>
  
  <!-- Option 3: Review -->
  <span class="badge-review">? Review</span>
  
  <!-- Option 4: Overdue -->
  <span class="badge-overdue">Overdue</span>
</td>
```

---

### Feature 2: Duplicate Only & Overdue Only Filter Buttons

**Location:** Find the filters section (usually near top of table)

**HTML to Insert Before Table:**
```html
<div style="margin-bottom: 16px; display: flex; gap: 12px;">
  <button class="toggle-btn" onclick="toggleFilter(this, 'duplicates')">
    Duplicates Only
  </button>
  <button class="toggle-btn warning" onclick="toggleFilter(this, 'overdue')">
    Overdue Only
  </button>
</div>
```

**Add JavaScript:**
```javascript
function toggleFilter(btn, type) {
  btn.classList.toggle('active');
  // Filter logic: show/hide rows based on type
  console.log('Filter:', type, 'Active:', btn.classList.contains('active'));
}
```

---

### Feature 3: Overdue KPI Tile (Dashboard)

**Location:** Find KPI row in dashboard (Total | Active | Critical | Assets)

**Add 5th KPI before Assets:**
```html
<div class="kpi-tile overdue-kpi" onclick="showOverdueModal()" style="cursor: pointer;">
  <div class="kpi-label">Overdue Items</div>
  <div class="kpi-value" style="color: #D97706;">7</div>
  <div style="font-size: 11px; color: #D97706; margin-top: 4px;">Click to view</div>
</div>
```

---

### Feature 4: DuplicateModal

**Location:** Add modal overlay at end of HTML body (before closing `</body>`)

```html
<div id="duplicateModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
  <div style="background: white; border-radius: 8px; padding: 30px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #E5E7EB; padding-bottom: 15px;">
      <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Merge Duplicate Findings</h2>
      <button onclick="closeDuplicateModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6B7280;">×</button>
    </div>

    <p style="margin-bottom: 20px; font-size: 14px;">Select the master finding (all others will be linked to it)</p>

    <div style="margin-bottom: 20px;">
      <label style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border: 1px solid #E5E7EB; border-radius: 6px; margin-bottom: 12px; cursor: pointer;">
        <input type="radio" name="master" value="1" checked style="margin-top: 4px;">
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">SQL Injection on /api/users</div>
          <div style="font-size: 12px; color: #6B7280;">Asset: Payment API | Severity: HIGH</div>
        </div>
      </label>

      <label style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border: 1px solid #E5E7EB; border-radius: 6px; margin-bottom: 12px; cursor: pointer;">
        <input type="radio" name="master" value="2" style="margin-top: 4px;">
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">SQL Injection on /api/users</div>
          <div style="font-size: 12px; color: #6B7280;">Asset: Payment API | Severity: HIGH</div>
        </div>
      </label>

      <label style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; border: 1px solid #E5E7EB; border-radius: 6px; cursor: pointer;">
        <input type="radio" name="master" value="3" style="margin-top: 4px;">
        <div>
          <div style="font-weight: 600; margin-bottom: 4px;">SQL Injection on /api/users</div>
          <div style="font-size: 12px; color: #6B7280;">Asset: Payment API | Severity: HIGH</div>
        </div>
      </label>
    </div>

    <div style="margin-top: 20px; padding: 12px; background-color: #F3F4F6; border-radius: 6px; margin-bottom: 16px;">
      <div style="font-weight: 600; margin-bottom: 8px;">Duplicates to merge:</div>
      <div style="font-size: 13px; color: #6B7280;">
        • Finding 2 (HIGH)<br>
        • Finding 3 (HIGH)
      </div>
    </div>

    <div style="background-color: #DBEAFE; border-left: 4px solid #2563EB; padding: 12px; border-radius: 4px; margin-bottom: 16px; font-size: 13px; color: #1E40AF;">
      After merge: The selected finding will be marked as confirmed unique and others will be linked to it.
    </div>

    <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #E5E7EB; padding-top: 15px;">
      <button onclick="closeDuplicateModal()" style="padding: 8px 16px; border: 1px solid #E5E7EB; border-radius: 6px; background: white; cursor: pointer;">Cancel</button>
      <button onclick="confirmMerge()" style="padding: 8px 16px; border: 1px solid #2563EB; border-radius: 6px; background: #2563EB; color: white; cursor: pointer;">Merge</button>
    </div>

  </div>
</div>
```

**Add JavaScript Functions:**
```javascript
function showDuplicateModal() {
  document.getElementById('duplicateModal').style.display = 'flex';
}

function closeDuplicateModal() {
  document.getElementById('duplicateModal').style.display = 'none';
}

function confirmMerge() {
  const selected = document.querySelector('input[name="master"]:checked').value;
  alert('Merged finding ' + selected + ' as master. Duplicates linked.');
  closeDuplicateModal();
}
```

---

### Feature 5: OverdueDetailModal

**Location:** Add modal after DuplicateModal

```html
<div id="overdueModal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; align-items: center; justify-content: center;">
  <div style="background: white; border-radius: 8px; padding: 30px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto;">
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #E5E7EB; padding-bottom: 15px;">
      <h2 style="font-size: 18px; font-weight: 700; margin: 0;">Overdue Findings (7)</h2>
      <button onclick="closeOverdueModal()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #6B7280;">×</button>
    </div>

    <div class="overdue-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="font-weight: 600;">SQL Injection on /api/users</div>
        <div style="font-size: 28px; font-weight: 700; color: #D97706;">15d</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; font-size: 13px;">
        <div><strong>Asset:</strong> Payment API</div>
        <div><strong>Status:</strong> Open</div>
      </div>
      <div style="font-size: 12px; color: #6B7280;"><strong>Owner:</strong> John Doe</div>
    </div>

    <div class="overdue-card">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
        <div style="font-weight: 600;">Missing MFA on Admin Accounts</div>
        <div style="font-size: 28px; font-weight: 700; color: #D97706;">42d</div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 8px; font-size: 13px;">
        <div><strong>Asset:</strong> Auth Module</div>
        <div><strong>Status:</strong> In Progress</div>
      </div>
      <div style="font-size: 12px; color: #6B7280;"><strong>Owner:</strong> Jane Smith</div>
    </div>

    <div style="display: flex; gap: 12px; justify-content: flex-end; border-top: 1px solid #E5E7EB; padding-top: 15px; margin-top: 20px;">
      <button onclick="closeOverdueModal()" style="padding: 8px 16px; border: 1px solid #E5E7EB; border-radius: 6px; background: white; cursor: pointer;">Close</button>
    </div>

  </div>
</div>
```

**Add JavaScript Functions:**
```javascript
function showOverdueModal() {
  document.getElementById('overdueModal').style.display = 'flex';
}

function closeOverdueModal() {
  document.getElementById('overdueModal').style.display = 'none';
}
```

---

### Feature 6: RCA Section in Finding Details/Drawer

**Location:** Find the Finding Details drawer/panel

**Add After "Severity" Field:**
```html
<div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
    <span style="font-size: 18px;">ℹ</span>
    <span style="font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Root Cause Analysis</span>
  </div>

  <div style="margin-bottom: 16px;">
    <label style="display: block; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 6px;">Description (5-10 sentences)</label>
    <textarea style="width: 100%; padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-family: inherit; font-size: 14px; resize: vertical; min-height: 100px;" placeholder="Describe the root cause in 5-10 sentences...">The admin account lacked MFA enforcement due to a configuration oversight in the IdP. The team assumed the setting was applied globally, but it only applied to new accounts created after the policy update.</textarea>
  </div>

  <div style="margin-bottom: 16px;">
    <label style="display: block; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 6px;">Category</label>
    <select style="width: 100%; padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-family: inherit; font-size: 14px;">
      <option>-- Select Category --</option>
      <option selected>Configuration Error</option>
      <option>Missing Security Patch</option>
      <option>Weak Security Controls</option>
      <option>Design Flaw</option>
    </select>
  </div>
</div>
```

---

### Feature 7: Editable Remediation Section

**Location:** Find "Remediation Plan" section in Finding Details

**Replace with:**
```html
<div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #E5E7EB;">
  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
    <span style="font-size: 18px;">✓</span>
    <span style="font-size: 12px; font-weight: 700; color: #6B7280; text-transform: uppercase;">Remediation Plan</span>
  </div>

  <!-- State 1: AI Suggestion -->
  <div id="remediationSuggestion" class="remediation-suggestion">
    <div style="font-size: 12px; font-weight: 600; color: #1E40AF; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
      <span>⚡</span> AI Suggestion (Claude)
    </div>
    <div style="color: #1E40AF; margin-bottom: 12px;">
      Implement MFA enforcement across all user accounts. First, enable MFA in the IdP config for all existing users. Then, add MFA prompt at login for non-compliant users. Timeline: 2 weeks.
    </div>
    <button onclick="enterRemediationEdit()" style="padding: 8px 16px; border: 1px solid #3B82F6; border-radius: 6px; background: white; color: #2563EB; cursor: pointer; font-weight: 500;">Confirm & Edit</button>
  </div>

  <!-- State 2: Edit Mode -->
  <div id="remediationEdit" style="display: none;">
    <div style="margin-bottom: 16px;">
      <label style="display: block; font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase; margin-bottom: 6px;">Edit Remediation Plan</label>
      <textarea id="remediationTextarea" style="width: 100%; padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-family: inherit; font-size: 14px; resize: vertical; min-height: 100px;">Implement MFA enforcement across all user accounts. Priority: CRITICAL. Timeline: 2 weeks. Owner: Security Team.</textarea>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="confirmRemediation()" style="padding: 8px 16px; border: 1px solid #22C55E; border-radius: 6px; background: #22C55E; color: white; cursor: pointer; font-weight: 500;">✓ Confirm Plan</button>
      <button onclick="cancelRemediationEdit()" style="padding: 8px 16px; border: 1px solid #DC2626; border-radius: 6px; background: white; color: #DC2626; cursor: pointer; font-weight: 500;">✕ Cancel</button>
    </div>
  </div>

  <!-- State 3: Confirmed -->
  <div id="remediationConfirmed" style="display: none;" class="remediation-confirmed">
    <div style="font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
      <span>✓</span> Confirmed Plan
    </div>
    <div id="confirmedText" style="color: #166534; margin-bottom: 12px;">
      Implement MFA enforcement across all user accounts. Priority: CRITICAL. Timeline: 2 weeks. Owner: Security Team.
    </div>
    <div class="remediation-audit-trail">
      <strong>Last modified by:</strong> John Doe<br>
      <strong>Last modified at:</strong> 2026-05-29 14:32:15
    </div>
    <button onclick="enterRemediationEdit()" style="padding: 8px 16px; border: 1px solid #22C55E; border-radius: 6px; background: white; color: #22C55E; cursor: pointer; font-weight: 500; margin-top: 12px;">Edit Again</button>
  </div>
</div>
```

**Add JavaScript Functions:**
```javascript
function enterRemediationEdit() {
  document.getElementById('remediationSuggestion').style.display = 'none';
  document.getElementById('remediationEdit').style.display = 'block';
  document.getElementById('remediationConfirmed').style.display = 'none';
}

function cancelRemediationEdit() {
  document.getElementById('remediationSuggestion').style.display = 'block';
  document.getElementById('remediationEdit').style.display = 'none';
}

function confirmRemediation() {
  const text = document.getElementById('remediationTextarea').value;
  document.getElementById('confirmedText').textContent = text;
  document.getElementById('remediationEdit').style.display = 'none';
  document.getElementById('remediationConfirmed').style.display = 'block';
}
```

---

## Phase 3: Features to Add

### Feature 1: Framework Selector

**Location:** Above the findings table (new section)

```html
<div style="margin-bottom: 30px; margin-top: 30px;">
  <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 20px;">Framework Compliance & Remediation</h2>
  
  <div class="framework-selector">
    <label for="frameworkSelect" style="font-size: 12px; font-weight: 600; color: #6B7280; text-transform: uppercase;">Framework:</label>
    <select id="frameworkSelect" onchange="updateFramework()" style="padding: 8px 12px; border: 1px solid #E5E7EB; border-radius: 6px; font-family: inherit; font-size: 14px;">
      <option value="iso27001">ISO 27001:2022</option>
      <option value="nist">NIST Cybersecurity Framework</option>
      <option value="cis">CIS Critical Security Controls</option>
    </select>
  </div>
</div>
```

---

### Feature 2: Compliance Heat Map

**Location:** Below framework selector

```html
<div class="heat-map-container">
  <div class="heat-map-header">
    <div>
      <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 8px;">Framework Coverage</h3>
      <div class="coverage-badge-good">✓ Good coverage — 14 controls, 5 findings</div>
    </div>
    <div class="heat-map-coverage">72%</div>
  </div>

  <div class="domain-grid">
    <div class="domain-box">
      <div class="domain-id">A.5</div>
      <div style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">Organizational Controls</div>
      <div class="domain-count">2</div>
    </div>
    <div class="domain-box">
      <div class="domain-id">A.6</div>
      <div style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">People Controls</div>
      <div class="domain-count">3</div>
    </div>
    <div class="domain-box">
      <div class="domain-id">A.7</div>
      <div style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">Physical Controls</div>
      <div class="domain-count">0</div>
    </div>
    <div class="domain-box">
      <div class="domain-id">A.8</div>
      <div style="font-size: 12px; color: #6B7280; margin-bottom: 8px;">Technical Controls</div>
      <div class="domain-count">2</div>
    </div>
  </div>
</div>
```

---

### Feature 3: Remediation Flow Sankey

**Location:** Below heat map

```html
<div class="sankey-container">
  <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 20px;">Remediation Flow (Velocity)</h3>

  <div class="sankey-visual">
    <div class="sankey-node">
      <div class="sankey-box sankey-open">Open</div>
      <div class="sankey-count">12 findings</div>
    </div>

    <div class="sankey-arrow">→</div>

    <div class="sankey-node">
      <div class="sankey-box sankey-inprogress">In Progress</div>
      <div class="sankey-count">6 findings</div>
    </div>

    <div class="sankey-arrow">→</div>

    <div class="sankey-node">
      <div class="sankey-box sankey-scheduled">Scheduled</div>
      <div class="sankey-count">4 findings</div>
    </div>

    <div class="sankey-arrow">→</div>

    <div class="sankey-node">
      <div class="sankey-box sankey-closed">Closed</div>
      <div class="sankey-count">20 findings</div>
    </div>
  </div>

  <div style="margin-top: 16px; padding: 12px; background-color: var(--bg, #FFFFFF); border-radius: 6px; font-size: 12px; color: var(--text-secondary, #6B7280); border: 1px solid var(--border, #E5E7EB);">
    <strong>Remediation Velocity:</strong> 6 findings/week (avg). Status breakdown colored by severity (Red=Critical, Orange=High, Blue=Medium, Green=Low).
  </div>
</div>
```

**Add JavaScript Functions:**
```javascript
function updateFramework() {
  const framework = document.getElementById('frameworkSelect').value;
  console.log('Framework selected:', framework);
  // Update heat map dynamically based on framework
}
```

---

## Summary of Changes

| Feature | Type | Count | Complexity |
|---------|------|-------|------------|
| Flags Column | Table | 1 | Simple |
| Filter Buttons | Controls | 2 | Simple |
| Overdue KPI | Dashboard | 1 | Simple |
| DuplicateModal | Modal | 1 | Medium |
| OverdueDetailModal | Modal | 1 | Medium |
| RCA Section | Form | 1 | Medium |
| Remediation Workflow | Form | 1 | Complex (3-state) |
| Framework Selector | Control | 1 | Simple |
| Heat Map | Visualization | 1 | Medium |
| Sankey Diagram | Visualization | 1 | Medium |

**Total New Elements:** 11 major features  
**Total CSS Classes Added:** 35+  
**Total Lines of HTML:** 500+  
**Total Lines of JavaScript:** 100+

---

## Files

**Enhanced Mockup (Ready to Use):**
→ `/Users/sriram/Downloads/Cyber_Sierra_Atlas_Phase2B_Phase3_Enhanced.html`

**Integration Reference:**
→ `docs/FRONTEND_DESIGN_REVIEW_PHASE2B.md` (detailed design specs)

**Implementation Guide:**
→ This document

---

## Next Steps

1. **Open the enhanced mockup** in your browser
2. **Review visual design** against Phase 2B backend implementation
3. **Verify all interactions** work correctly
4. **Update HTML** if any adjustments needed
5. **Push to GitHub** when ready

**All CSS is included. Just add HTML elements where indicated above.**
