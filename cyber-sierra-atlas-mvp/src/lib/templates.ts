import { Finding } from './schema';

export interface FindingTemplate {
  id: string;
  name: string;
  description: string;
  baseProperties: Partial<Finding>;
}

export const FINDING_TEMPLATES: FindingTemplate[] = [
  {
    id: 'default-password',
    name: 'Default Credentials',
    description: 'Device or service using default factory credentials',
    baseProperties: {
      severity: 'High',
      title: 'Default Credentials Detected',
      description: 'Device/service is still using default manufacturer credentials which poses significant security risk.',
      control_framework: 'NIST 800-53',
      control_clause: 'IA-2',
      remediation_notes: 'Change all default passwords to strong, unique credentials. Document the changes.',
    },
  },
  {
    id: 'outdated-tls',
    name: 'Outdated TLS Version',
    description: 'Service using TLS 1.0, 1.1, or unencrypted communication',
    baseProperties: {
      severity: 'High',
      title: 'Outdated TLS Version in Use',
      description: 'Service is using deprecated TLS versions (1.0, 1.1) or no encryption at all.',
      control_framework: 'NIST 800-53',
      control_clause: 'SC-8',
      remediation_notes: 'Upgrade to TLS 1.2 or 1.3 and disable older protocols.',
    },
  },
  {
    id: 'missing-mfa',
    name: 'Missing Multi-Factor Authentication',
    description: 'Admin portal or sensitive system lacks MFA',
    baseProperties: {
      severity: 'Critical',
      title: 'Lack of Multi-Factor Authentication',
      description: 'Administrative or sensitive system does not require multi-factor authentication.',
      control_framework: 'ISO 27001',
      control_clause: 'A.9.2.1',
      remediation_notes: 'Implement MFA for all administrative and sensitive accounts.',
    },
  },
  {
    id: 'weak-password-policy',
    name: 'Weak Password Policy',
    description: 'Password complexity requirements not enforced',
    baseProperties: {
      severity: 'High',
      title: 'Weak Password Policy',
      description: 'Password complexity requirements are not enforced, allowing weak passwords.',
      control_framework: 'ISO 27001',
      control_clause: 'A.9.2.1',
      remediation_notes: 'Enforce minimum 12 characters, uppercase, lowercase, numbers, and special characters.',
    },
  },
  {
    id: 'unpatched-system',
    name: 'Unpatched System',
    description: 'System is running outdated/unpatched software',
    baseProperties: {
      severity: 'High',
      title: 'System Not Patched',
      description: 'System is running outdated or unpatched software with known vulnerabilities.',
      control_framework: 'NIST 800-53',
      control_clause: 'SI-2',
      remediation_notes: 'Apply all available security patches. Establish patch management schedule.',
    },
  },
  {
    id: 'excessive-permissions',
    name: 'Excessive Permissions',
    description: 'User or service account has overly broad permissions',
    baseProperties: {
      severity: 'Medium',
      title: 'Excessive Access Permissions',
      description: 'Account has permissions beyond what is required for its function.',
      control_framework: 'ISO 27001',
      control_clause: 'A.9.1.1',
      remediation_notes: 'Implement principle of least privilege. Audit and remove unnecessary permissions.',
    },
  },
  {
    id: 'open-port',
    name: 'Unnecessary Open Port',
    description: 'Service port is open but should not be accessible',
    baseProperties: {
      severity: 'Medium',
      title: 'Unnecessary Port Open',
      description: 'Network port is open and accessible but not required for business function.',
      control_framework: 'NIST 800-53',
      control_clause: 'CA-3',
      remediation_notes: 'Close unnecessary ports. Restrict access using network firewall.',
    },
  },
  {
    id: 'no-encryption',
    name: 'Data Not Encrypted at Rest',
    description: 'Sensitive data stored without encryption',
    baseProperties: {
      severity: 'High',
      title: 'Sensitive Data Not Encrypted',
      description: 'Sensitive data is stored without encryption, violating data protection requirements.',
      control_framework: 'ISO 27001',
      control_clause: 'A.10.1.1',
      remediation_notes: 'Implement encryption for all sensitive data at rest using AES-256 or equivalent.',
    },
  },
  {
    id: 'logging-disabled',
    name: 'Logging Disabled',
    description: 'Critical system has logging disabled or not configured',
    baseProperties: {
      severity: 'Medium',
      title: 'Logging Not Enabled',
      description: 'Critical system does not have logging enabled for audit and compliance.',
      control_framework: 'NIST 800-53',
      control_clause: 'AU-2',
      remediation_notes: 'Enable comprehensive logging. Send logs to centralized SIEM system.',
    },
  },
];

export function getTemplate(templateId: string): FindingTemplate | undefined {
  return FINDING_TEMPLATES.find(t => t.id === templateId);
}

export function createFindingFromTemplate(templateId: string, asset: { id: string; name: string; type: string }): Partial<Finding> {
  const template = getTemplate(templateId);
  if (!template) throw new Error(`Template not found: ${templateId}`);

  return {
    ...template.baseProperties,
    asset_id: asset.id,
    asset_name: asset.name,
    status: 'Open',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    related_findings: [],
    source_document: {
      filename: 'Manual (Template)',
      upload_date: new Date().toISOString(),
      parser_confidence: 1.0,
    },
  };
}
