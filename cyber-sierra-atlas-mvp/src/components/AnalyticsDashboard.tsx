import React from 'react';
import { Finding } from '../lib/schema';
import {
  calculateFrameworkCoverage,
  getFrameworkGaps,
  getAllFrameworkCoverage,
} from '../lib/framework-mapping';
import {
  countByStatus,
  countBySeverity,
  buildSeverityDistribution,
  getRemediationVelocity,
} from '../lib/sankey-transform';
import { FRAMEWORKS, SEVERITY_COLORS } from '../lib/framework-constants';

interface AnalyticsDashboardProps {
  findings: Finding[];
}

export function AnalyticsDashboard({ findings }: AnalyticsDashboardProps) {
  const frameworkCoverage = getAllFrameworkCoverage(findings);
  const statusCounts = countByStatus(findings);
  const severityCounts = countBySeverity(findings);
  const velocity = getRemediationVelocity(findings);
  const severityDistribution = buildSeverityDistribution(findings);

  return (
    <div className="space-y-6 p-6">
      {/* Framework Compliance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(frameworkCoverage).map(([framework, coverage]) => (
          <FrameworkCard
            key={framework}
            framework={framework}
            coverage={coverage}
            findings={findings}
          />
        ))}
      </div>

      {/* Remediation Status Overview */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Remediation Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatusCard
            label="Open"
            value={statusCounts.open}
            color="bg-red-500"
          />
          <StatusCard
            label="In Progress"
            value={statusCounts.in_progress}
            color="bg-yellow-500"
          />
          <StatusCard
            label="Scheduled"
            value={statusCounts.scheduled}
            color="bg-blue-500"
          />
          <StatusCard
            label="Closed"
            value={statusCounts.closed}
            color="bg-green-500"
          />
        </div>
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-600">
            Closure Rate: <span className="font-bold text-lg">{velocity.closureRate}%</span>
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${velocity.closureRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Severity Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Severity Distribution</h3>
        <div className="space-y-3">
          {severityDistribution.map(({ name, value, color }) => (
            <div key={name}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-sm font-bold">{value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: color,
                    width: `${Math.min(
                      (value / Math.max(...severityDistribution.map(s => s.value), 1)) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard label="Total Findings" value={findings.length} />
        <StatCard
          label="Critical/High"
          value={severityCounts.Critical + severityCounts.High}
        />
      </div>
    </div>
  );
}

function FrameworkCard({
  framework,
  coverage,
  findings,
}: {
  framework: string;
  coverage: number;
  findings: Finding[];
}) {
  const gaps = getFrameworkGaps(
    findings,
    framework as 'iso27001' | 'nist_csf' | 'cis_controls'
  );

  const frameworkName =
    FRAMEWORKS[framework as keyof typeof FRAMEWORKS]?.name || framework;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-md font-semibold mb-2">{frameworkName}</h3>
      <div className="text-3xl font-bold mb-2">{coverage}%</div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all"
          style={{ width: `${coverage}%` }}
        />
      </div>
      <p className="text-xs text-gray-600">
        {gaps.length} gaps remaining
      </p>
    </div>
  );
}

function StatusCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 text-center">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <div className={`${color} text-white rounded p-2 inline-block mb-2`}>
        <span className="text-xl font-bold">{value}</span>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
