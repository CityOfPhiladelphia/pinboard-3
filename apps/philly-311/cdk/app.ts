#!/usr/bin/env node
import { App, CfnOutput, Fn, Stack } from 'aws-cdk-lib'
import * as route53 from 'aws-cdk-lib/aws-route53'
import {
  StaticSite,
  Confidentiality,
  applyStandardTags,
  applyNagChecks,
  PhilaLogBucket,
  type Environment,
} from '@phila/constructs'

const app = new App()

// Environment is determined by CDK context
const environment = app.node.tryGetContext('environment') as Environment

if (!environment) {
  throw new Error('Environment must be specified via context. Use: cdk deploy -c environment=dev')
}

// Read compliance frameworks from context
const compliance = app.node.tryGetContext('compliance')
const complianceFrameworks = compliance ? compliance.split(',') : []

// Application context with governance metadata
const context = {
  appName: 'philly-311',
  environment,
  department: '4-oit',
  team: 'Software Engineering',
  contact: 'websupport@phila.gov',
  compliance: complianceFrameworks,
  confidentiality: Confidentiality.MEDIUM,
  cliVersion: '0.7.0',
}

// Stack name follows pattern: {appName}-{environment}
const stack = new Stack(app, 'philly-311-' + environment, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: 'philly-311-' + environment,
})

const frontendDomain = app.node.tryGetContext('frontendDomain') as string | undefined
let frontendZone: route53.IHostedZone | undefined
if (frontendDomain) {
  const zone = new route53.PublicHostedZone(stack, 'FrontendZone', {
    zoneName: frontendDomain,
  })
  frontendZone = zone
  if (zone.hostedZoneNameServers) {
    new CfnOutput(stack, 'FrontendHostedZoneNS', {
      value: Fn.join(', ', zone.hostedZoneNameServers),
      description: `Delegate ${frontendDomain} to Route53: add these NS records at your domain registrar`,
    })
  }
}

const accessLogBucket = new PhilaLogBucket(stack, 'AccessLogs', {
  ...context,
  logBucketId: 'access-logs',
  logRetentionDays: 1096,
  s3ManagedEncryption: true,
})

// Scope as any so linked @phila/constructs resolves to a single Construct type at runtime.
new StaticSite(stack, 'philly-311Site', {
  ...context,
  assetDir: '../frontend/dist',
  ...(frontendZone ? { hostedZone: frontendZone } : {}),
  logBucket: accessLogBucket.bucket,
})

applyStandardTags(app, context)
applyNagChecks(app)

app.synth()
