import React, { useState } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Finding } from '../lib/schema';
import { extractAuditFindings, parseManualFinding } from '../lib/parser';
import { validateManualEntry, ValidationResult } from '../lib/audit-validation';
import { ManualFindingInput } from '../lib/audit-types';

interface AuditUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParsedFindings: (findings: Finding[]) => void;
}

type TabType = 'upload' | 'manual';
type LoadingState = 'idle' | 'extracting' | 'success' | 'error';

export function AuditUploadModal({ isOpen, onClose, onParsedFindings }: AuditUploadModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: '16px'
    }}>
      <div style={{
        backgroundColor: 'var(--frt-bg)',
        borderRadius: '12px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid var(--frt-border)'
      }}>

        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--frt-border-soft)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          backgroundColor: 'var(--frt-bg-soft)'
        }}>
          <div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 600,
              color: 'var(--frt-text-strong)',
              marginBottom: '4px'
            }}>Add Audit Findings</h2>
            <p style={{
              fontSize: '13px',
              color: 'var(--frt-text-mid)',
              margin: 0
            }}>Upload security reports or enter findings manually</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              color: 'var(--frt-text-mid)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid var(--frt-border)',
          backgroundColor: 'var(--frt-bg)',
          padding: '0 4px'
        }}>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1,
              padding: '14px 16px',
              fontWeight: 500,
              fontSize: '14px',
              color: activeTab === 'upload' ? 'var(--frt-accent)' : 'var(--frt-text-mid)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'upload' ? '3px solid var(--frt-accent)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Upload size={16} /> Upload Report
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            style={{
              flex: 1,
              padding: '14px 16px',
              fontWeight: 500,
              fontSize: '14px',
              color: activeTab === 'manual' ? 'var(--frt-accent)' : 'var(--frt-text-mid)',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'manual' ? '3px solid var(--frt-accent)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FileText size={16} /> Manual Entry
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {activeTab === 'upload' && (
            <UploadTab onParsedFindings={onParsedFindings} onClose={onClose} setLoadingState={setLoadingState} setError={setError} loadingState={loadingState} error={error} />
          )}
          {activeTab === 'manual' && (
            <ManualEntryTab onParsedFindings={onParsedFindings} onClose={onClose} setLoadingState={setLoadingState} setError={setError} loadingState={loadingState} error={error} />
          )}
        </div>
      </div>
    </div>
  );
}

interface TabProps {
  onParsedFindings: (findings: Finding[]) => void;
  onClose: () => void;
  setLoadingState: (state: LoadingState) => void;
  setError: (error: string) => void;
  loadingState: LoadingState;
  error: string;
}

function UploadTab({ onParsedFindings, onClose, setLoadingState, setError, loadingState, error }: TabProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.includes('pdf') && !file.name.includes('xlsx') && !file.name.includes('xls') && !file.name.includes('json') && !file.name.includes('docx')) {
      setError('Unsupported file format. Please upload PDF, Excel, JSON, or Word documents.');
      return;
    }

    setLoadingState('extracting');
    setError('');

    try {
      const findings = await extractAuditFindings(file);
      setLoadingState('success');
      setTimeout(() => {
        onParsedFindings(findings);
        onClose();
      }, 1000);
    } catch (err) {
      setLoadingState('error');
      setError(err instanceof Error ? err.message : 'Failed to extract findings from file');
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {loadingState === 'idle' && (
        <>
          {/* Upload Hint Banner */}
          {!error && (
            <div className="fr-uploadhint">
              <div className="fr-uploadhint-num">📄</div>
              <div className="fr-uploadhint-body">
                <div className="fr-uploadhint-title">Import security audit findings</div>
                <div className="fr-uploadhint-steps">
                  <div>1. Upload PDF, Excel, JSON, or Word report</div>
                  <div>2. System extracts findings automatically</div>
                  <div>3. Review and import to registry</div>
                </div>
              </div>
            </div>
          )}

          {/* Drag Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              border: '2px dashed ' + (dragActive ? 'var(--frt-accent)' : 'var(--frt-border)'),
              borderRadius: '10px',
              padding: '32px 16px',
              textAlign: 'center',
              transition: 'all 0.2s ease',
              backgroundColor: dragActive ? 'rgba(45, 214, 255, 0.05)' : 'transparent',
              cursor: 'pointer'
            }}
          >
            <Upload size={40} style={{ margin: '0 auto 12px', color: 'var(--frt-text-mid)' }} />
            <p style={{
              fontSize: '15px',
              fontWeight: 500,
              color: 'var(--frt-text-strong)',
              margin: '0 0 8px 0'
            }}>
              Drag & drop your report here
            </p>
            <p style={{
              fontSize: '13px',
              color: 'var(--frt-text-mid)',
              margin: '0 0 16px 0'
            }}>
              or select a file
            </p>
            <label style={{
              display: 'inline-block',
              cursor: 'pointer'
            }}>
              <input
                type="file"
                accept=".pdf,.xlsx,.xls,.json,.docx,.doc"
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
              <span style={{
                display: 'inline-block',
                padding: '10px 20px',
                backgroundColor: 'var(--frt-accent)',
                color: 'var(--frt-on-accent)',
                borderRadius: '7px',
                fontWeight: 500,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }} onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                Browse Files
              </span>
            </label>
            <p style={{
              fontSize: '12px',
              color: 'var(--frt-text-dim)',
              margin: '12px 0 0 0'
            }}>
              PDF, Excel, JSON, Word (up to 25MB)
            </p>
          </div>

          {error && (
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(255, 140, 112, 0.1)',
              border: '1px solid var(--cs-danger)',
              borderRadius: '7px',
              display: 'flex',
              gap: '12px'
            }}>
              <AlertCircle size={18} style={{ color: 'var(--cs-danger)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{
                fontSize: '13px',
                color: 'var(--cs-danger)',
                margin: 0
              }}>{error}</p>
            </div>
          )}
        </>
      )}

      {loadingState === 'extracting' && (
        <div style={{
          textAlign: 'center',
          padding: '48px 0'
        }}>
          <Loader2 size={40} style={{ margin: '0 auto 16px', color: 'var(--frt-accent)', animation: 'spin 1s linear infinite' }} />
          <p style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--frt-text-strong)',
            margin: '0 0 8px 0'
          }}>Extracting findings...</p>
          <p style={{
            fontSize: '13px',
            color: 'var(--frt-text-mid)',
            margin: 0
          }}>This may take a moment</p>
        </div>
      )}

      {loadingState === 'success' && (
        <div style={{
          textAlign: 'center',
          padding: '48px 0'
        }}>
          <CheckCircle size={40} style={{ margin: '0 auto 16px', color: 'var(--cs-success)' }} />
          <p style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--frt-text-strong)',
            margin: '0 0 8px 0'
          }}>Extraction complete!</p>
          <p style={{
            fontSize: '13px',
            color: 'var(--frt-text-mid)',
            margin: 0
          }}>Findings ready for review</p>
        </div>
      )}

      {loadingState === 'error' && (
        <div style={{
          textAlign: 'center',
          padding: '48px 0'
        }}>
          <AlertCircle size={40} style={{ margin: '0 auto 16px', color: 'var(--cs-danger)' }} />
          <p style={{
            fontSize: '15px',
            fontWeight: 500,
            color: 'var(--frt-text-strong)',
            margin: '0 0 8px 0'
          }}>Extraction failed</p>
          <p style={{
            fontSize: '13px',
            color: 'var(--frt-text-mid)',
            margin: '0 0 16px 0'
          }}>{error}</p>
          <button
            onClick={() => setLoadingState('idle')}
            style={{
              padding: '10px 20px',
              backgroundColor: 'var(--frt-accent)',
              color: 'var(--frt-on-accent)',
              border: 'none',
              borderRadius: '7px',
              fontWeight: 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}

function ManualEntryTab({ onParsedFindings, onClose, setLoadingState, setError, loadingState, error }: TabProps) {
  const [formData, setFormData] = useState<ManualFindingInput>({
    title: '',
    description: '',
    severity: 'High',
    auditReportType: 'pen-test',
  });
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, errors: [] });

  const handleInputChange = (field: keyof ManualFindingInput, value: any) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    // Real-time validation
    const result = validateManualEntry(updated);
    setValidation(result);
  };

  const handleSubmit = () => {
    const result = validateManualEntry(formData);
    if (!result.valid) {
      setValidation(result);
      return;
    }

    setLoadingState('extracting');
    setError('');

    try {
      const finding = parseManualFinding(formData);
      setLoadingState('success');
      setTimeout(() => {
        onParsedFindings([finding]);
        onClose();
      }, 1000);
    } catch (err) {
      setLoadingState('error');
      setError(err instanceof Error ? err.message : 'Failed to create finding');
    }
  };

  if (loadingState === 'extracting') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Loader2 size={40} style={{ margin: '0 auto 16px', color: 'var(--frt-accent)', animation: 'spin 1s linear infinite' }} />
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--frt-text-strong)', margin: '0 0 8px 0' }}>Creating finding...</p>
      </div>
    );
  }

  if (loadingState === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <CheckCircle size={40} style={{ margin: '0 auto 16px', color: 'var(--cs-success)' }} />
        <p style={{ fontSize: '15px', fontWeight: 500, color: 'var(--frt-text-strong)', margin: '0 0 8px 0' }}>Finding created!</p>
        <p style={{ fontSize: '13px', color: 'var(--frt-text-mid)', margin: 0 }}>Ready for import</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Title Field */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--frt-text-strong)',
          marginBottom: '6px'
        }}>
          Title <span style={{ color: 'var(--cs-danger)' }}>*</span>
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          placeholder="e.g., SQL Injection vulnerability"
          className="fr-field"
          style={{ width: '100%' }}
        />
      </div>

      {/* Description Field */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--frt-text-strong)',
          marginBottom: '6px'
        }}>
          Description <span style={{ color: 'var(--cs-danger)' }}>*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Detailed description of the finding..."
          style={{
            width: '100%',
            minHeight: '120px'
          }}
          className="fr-longfield"
        />
      </div>

      {/* Severity & Report Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--frt-text-strong)',
            marginBottom: '6px'
          }}>
            Severity <span style={{ color: 'var(--cs-danger)' }}>*</span>
          </label>
          <select
            value={formData.severity}
            onChange={(e) => handleInputChange('severity', e.target.value)}
            className="fr-field"
            style={{ width: '100%' }}
          >
            <option>Critical</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </div>

        <div>
          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 500,
            color: 'var(--frt-text-strong)',
            marginBottom: '6px'
          }}>
            Report Type <span style={{ color: 'var(--cs-danger)' }}>*</span>
          </label>
          <select
            value={formData.auditReportType}
            onChange={(e) => handleInputChange('auditReportType', e.target.value)}
            className="fr-field"
            style={{ width: '100%' }}
          >
            <option value="pen-test">Pen Test</option>
            <option value="external-audit">External Audit</option>
            <option value="risk-assessment">Risk Assessment</option>
            <option value="vulnerability-scan">Vulnerability Scan</option>
            <option value="internal-audit">Internal Audit</option>
            <option value="incident">Incident</option>
          </select>
        </div>
      </div>

      {/* Asset Name */}
      <div>
        <label style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 500,
          color: 'var(--frt-text-strong)',
          marginBottom: '6px'
        }}>
          Asset Name
        </label>
        <input
          type="text"
          value={formData.assetName || ''}
          onChange={(e) => handleInputChange('assetName', e.target.value)}
          placeholder="e.g., API Server"
          className="fr-field"
          style={{ width: '100%' }}
        />
      </div>

      {/* Error Messages */}
      {error && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 140, 112, 0.1)',
          border: '1px solid var(--cs-danger)',
          borderRadius: '7px',
          display: 'flex',
          gap: '12px'
        }}>
          <AlertCircle size={18} style={{ color: 'var(--cs-danger)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '13px', color: 'var(--cs-danger)', margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div style={{
          padding: '12px 16px',
          backgroundColor: 'rgba(255, 140, 112, 0.1)',
          border: '1px solid var(--cs-danger)',
          borderRadius: '7px'
        }}>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--cs-danger)', margin: '0 0 8px 0' }}>Please fix:</p>
          <ul style={{ fontSize: '13px', color: 'var(--cs-danger)', margin: 0, paddingLeft: '20px' }}>
            {validation.errors.map((err) => (
              <li key={err} style={{ margin: '4px 0' }}>
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', paddingTop: '8px' }}>
        <button
          onClick={() => setFormData({
            title: '',
            description: '',
            severity: 'High',
            auditReportType: 'pen-test',
          })}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: 'transparent',
            color: 'var(--frt-text-mid)',
            border: '1px solid var(--frt-border)',
            borderRadius: '7px',
            fontWeight: 500,
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--frt-bg-soft)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          disabled={!validation.valid}
          style={{
            flex: 1,
            padding: '10px 16px',
            backgroundColor: validation.valid ? 'var(--frt-accent)' : 'var(--frt-border)',
            color: validation.valid ? 'var(--frt-on-accent)' : 'var(--frt-text-dim)',
            border: 'none',
            borderRadius: '7px',
            fontWeight: 500,
            fontSize: '14px',
            cursor: validation.valid ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => validation.valid && (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => validation.valid && (e.currentTarget.style.opacity = '1')}
        >
          Create Finding
        </button>
      </div>
    </div>
  );
}
