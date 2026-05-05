#!/usr/bin/env node
// import 'source-map-support/register'
import { App, Aspects, Stack } from 'aws-cdk-lib'
import { AwsSolutionsChecks, NIST80053R5Checks } from 'cdk-nag'
import {
  StaticSite,
  Confidentiality,
  type Environment,
  PhilaLogBucket,
} from '@phila/constructs'
import {
  Certificate,
  CertificateValidation,
} from 'aws-cdk-lib/aws-certificatemanager'
import { HostedZone } from 'aws-cdk-lib/aws-route53'
const app = new App()

// Environment is determined by CDK context
const environment = app.node.tryGetContext('environment') as Environment

if (!environment) {
  throw new Error(
    'Environment must be specified via context. Use: cdk deploy -c environment=test'
  )
}

if (environment === 'dev') {
  throw new Error('Environment must be test or prod. Dev is not on the cloud.')
}

// Read compliance frameworks from context
const compliance = app.node.tryGetContext('compliance')
const complianceFrameworks = compliance ? compliance.split(',') : []

// Application context with governance metadata
const context = {
  appName: 'flood-monitoring',
  environment,
  department: '4-oit',
  team: 'Software Engineering',
  contact: 'jake.rosenberg@phila.gov',
  compliance: complianceFrameworks,
  confidentiality: Confidentiality.LOW,
}

const stack = new Stack(app, `cloudfront-stack-${environment}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: `cloudfront-stack-${environment}`,
})

const domainName =
  environment === 'prod'
    ? `${context.appName}.phila.gov`
    : `${context.appName}-${environment}.phila.gov`

const hostedZone = HostedZone.fromLookup(stack, 'HostedZone', {
  domainName,
})

const dnsValidatedCertificate = new Certificate(stack, 'Certificate', {
  domainName,
  certificateName: `phila-gov-dns-cert-frontend-${environment}`, // is this right?
  validation: CertificateValidation.fromDns(hostedZone),
})

const accessLogBucket = new PhilaLogBucket(stack, 'AccessLogs', {
  ...context,
  logBucketId: 'access-logs',
  logRetentionDays: 1096,
  s3ManagedEncryption: true,
});


// Scope as any so linked @phila/constructs resolves to a single Construct type at runtime.
new StaticSite(stack, 'StaticSite', {
  ...context,
  assetDir: '../frontend/dist',
  certificate: dnsValidatedCertificate,
  hostedZone,
  logBucket: accessLogBucket.bucket
})

// Apply compliance checks
Aspects.of(app).add(new NIST80053R5Checks({ verbose: true }))
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

app.synth()