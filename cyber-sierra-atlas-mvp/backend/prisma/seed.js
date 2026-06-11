const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  try {
    // Clear existing data
    await prisma.finding.deleteMany();
    await prisma.cAPA.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'admin@atlas.local',
        name: 'Admin User',
        passwordHash: 'hashed_password_placeholder',
      },
    });

    console.log(`Created user: ${user.email}`);

    // Create test findings
    const findingsResult = await prisma.finding.createMany({
      data: [
        {
          title: 'SQL Injection vulnerability in API endpoint',
          description: 'User input not sanitized in /api/search endpoint',
          severity: 'critical',
          status: 'open',
          assignedTo: user.id,
        },
        {
          title: 'Missing TLS Certificate validation',
          description: 'Certificate pinning not implemented',
          severity: 'high',
          status: 'open',
          assignedTo: user.id,
        },
        {
          title: 'Weak password policy enforcement',
          description: 'Passwords can be too short',
          severity: 'high',
          status: 'in_progress',
          assignedTo: user.id,
        },
        {
          title: 'Outdated OpenSSL dependency',
          description: 'npm audit flagged version 1.0.2',
          severity: 'medium',
          status: 'open',
          assignedTo: user.id,
        },
        {
          title: 'Missing HTTPS redirect',
          description: 'HTTP traffic not redirected to HTTPS',
          severity: 'critical',
          status: 'resolved',
        },
        {
          title: 'Cross-Site Scripting (XSS) in dashboard',
          description: 'User-supplied data not escaped in metrics display',
          severity: 'high',
          status: 'in_progress',
          assignedTo: user.id,
        },
        {
          title: 'Insufficient rate limiting on auth endpoint',
          description: 'Brute force attacks possible',
          severity: 'medium',
          status: 'open',
        },
        {
          title: 'Unencrypted database backups',
          description: 'Backups stored without encryption',
          severity: 'critical',
          status: 'open',
          assignedTo: user.id,
        },
        {
          title: 'Missing CORS headers',
          description: 'API does not properly restrict origins',
          severity: 'medium',
          status: 'resolved',
        },
        {
          title: 'Hardcoded API keys in configuration',
          description: 'Production keys committed to repository',
          severity: 'critical',
          status: 'in_progress',
          assignedTo: user.id,
        },
      ],
    });

    console.log(`Created ${findingsResult.count} findings`);

    // Create test CAPAs
    const capasResult = await prisma.cAPA.createMany({
      data: [
        {
          title: 'Fix SQL Injection vulnerability',
          status: 'submitted',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Implement TLS certificate pinning',
          status: 'approved',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Update password policy requirements',
          status: 'draft',
          dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Upgrade OpenSSL dependency',
          status: 'closed',
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Enable HTTPS redirect',
          status: 'closed',
          dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Fix XSS vulnerability in dashboard',
          status: 'submitted',
          dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        },
        {
          title: 'Implement rate limiting on auth endpoint',
          status: 'draft',
          dueDate: null,
        },
        {
          title: 'Encrypt database backups',
          status: 'submitted',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      ],
    });

    console.log(`Created ${capasResult.count} CAPAs`);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
