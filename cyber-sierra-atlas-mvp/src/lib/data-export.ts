import { Store, Finding, Asset, Control } from './schema';

/**
 * Validates that the store data conforms to the expected schema
 */
export function validateStoreData(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    errors.push('Data must be a valid object');
    return { valid: false, errors };
  }

  const store = data as any;

  // Validate findings array
  if (!Array.isArray(store.findings)) {
    errors.push('findings must be an array');
  } else {
    store.findings.forEach((finding: any, index: number) => {
      if (!finding.id || typeof finding.id !== 'string') {
        errors.push(`Finding[${index}]: missing or invalid id`);
      }
      if (!finding.title || typeof finding.title !== 'string') {
        errors.push(`Finding[${index}]: missing or invalid title`);
      }
      if (!finding.severity || !['Critical', 'High', 'Medium', 'Low', 'Informational'].includes(finding.severity)) {
        errors.push(`Finding[${index}]: missing or invalid severity`);
      }
      if (!finding.status || !['Open', 'In Progress', 'Resolved', 'Closed', 'Risk Accepted'].includes(finding.status)) {
        errors.push(`Finding[${index}]: missing or invalid status`);
      }
      if (!finding.asset_id || typeof finding.asset_id !== 'string') {
        errors.push(`Finding[${index}]: missing or invalid asset_id`);
      }
      if (!finding.control_framework || typeof finding.control_framework !== 'string') {
        errors.push(`Finding[${index}]: missing or invalid control_framework`);
      }
      if (!finding.source_document || typeof finding.source_document !== 'object') {
        errors.push(`Finding[${index}]: missing or invalid source_document`);
      }
      if (!finding.created_at || typeof finding.created_at !== 'string') {
        errors.push(`Finding[${index}]: missing or invalid created_at`);
      }
      if (!finding.updated_at || typeof finding.updated_at !== 'string') {
        errors.push(`Finding[${index}]: missing or invalid updated_at`);
      }
      if (!Array.isArray(finding.related_findings)) {
        errors.push(`Finding[${index}]: related_findings must be an array`);
      }
    });
  }

  // Validate assets array
  if (!Array.isArray(store.assets)) {
    errors.push('assets must be an array');
  } else {
    store.assets.forEach((asset: any, index: number) => {
      if (!asset.id || typeof asset.id !== 'string') {
        errors.push(`Asset[${index}]: missing or invalid id`);
      }
      if (!asset.name || typeof asset.name !== 'string') {
        errors.push(`Asset[${index}]: missing or invalid name`);
      }
      if (!asset.type || !['application', 'database', 'infrastructure', 'saas', 'vendor', 'network', 'other'].includes(asset.type)) {
        errors.push(`Asset[${index}]: missing or invalid type`);
      }
      if (!asset.criticality || !['Critical', 'High', 'Medium', 'Low'].includes(asset.criticality)) {
        errors.push(`Asset[${index}]: missing or invalid criticality`);
      }
      if (!asset.created_at || typeof asset.created_at !== 'string') {
        errors.push(`Asset[${index}]: missing or invalid created_at`);
      }
      if (!asset.updated_at || typeof asset.updated_at !== 'string') {
        errors.push(`Asset[${index}]: missing or invalid updated_at`);
      }
      if (!Array.isArray(asset.dependencies)) {
        errors.push(`Asset[${index}]: dependencies must be an array`);
      }
    });
  }

  // Validate controls array
  if (!Array.isArray(store.controls)) {
    errors.push('controls must be an array');
  } else {
    store.controls.forEach((control: any, index: number) => {
      if (!control.framework || typeof control.framework !== 'string') {
        errors.push(`Control[${index}]: missing or invalid framework`);
      }
      if (!control.clause || typeof control.clause !== 'string') {
        errors.push(`Control[${index}]: missing or invalid clause`);
      }
      if (!control.description || typeof control.description !== 'string') {
        errors.push(`Control[${index}]: missing or invalid description`);
      }
    });
  }

  // Validate lastSaved
  if (!store.lastSaved || typeof store.lastSaved !== 'string') {
    errors.push('lastSaved must be a valid ISO8601 timestamp');
  } else {
    try {
      new Date(store.lastSaved).toISOString();
    } catch {
      errors.push('lastSaved must be a valid ISO8601 timestamp');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Exports the store with metadata
 */
export function exportStore(store: Store): string {
  const exportData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    metadata: {
      findingCount: store.findings.length,
      assetCount: store.assets.length,
      controlCount: store.controls.length,
      lastSaved: store.lastSaved,
    },
    data: store,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Imports and validates store data from JSON string
 */
export function importStore(jsonString: string): { success: boolean; store?: Store; errors: string[] } {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(jsonString);

    // Extract data from export format if present
    let storeData: any = parsed;
    if (parsed.version && parsed.data) {
      storeData = parsed.data;
    }

    // Validate the store data
    const validation = validateStoreData(storeData);

    if (!validation.valid) {
      errors.push(...validation.errors);
      return { success: false, errors };
    }

    // Reconstruct the store with proper types
    const store: Store = {
      findings: storeData.findings || [],
      assets: storeData.assets || [],
      controls: storeData.controls || [],
      lastSaved: storeData.lastSaved || new Date().toISOString(),
    };

    return { success: true, store, errors: [] };
  } catch (error) {
    if (error instanceof SyntaxError) {
      errors.push(`Invalid JSON: ${error.message}`);
    } else if (error instanceof Error) {
      errors.push(`Failed to import data: ${error.message}`);
    } else {
      errors.push('Failed to import data: unknown error');
    }
    return { success: false, errors };
  }
}

/**
 * Utility function to download a file
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'application/json'): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file:', error);
    throw new Error(`Failed to download file: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
}
