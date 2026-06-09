#!/usr/bin/env node
import 'source-map-support/register'
import { App, CfnOutput, Fn, Stack } from 'aws-cdk-lib'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as route53 from 'aws-cdk-lib/aws-route53'
import {
  StaticSite,
  Confidentiality,
  applyStandardTags,
  applyNagChecks,
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
  appName: 'primary-care-finder',
  environment,
  department: '4-oit',
  team: 'Software Engineering',
  contact: 'andy.rothwell@phila.gov',
  compliance: complianceFrameworks,
  confidentiality: Confidentiality.LOW,
  cliVersion: '0.0.29',
}

// Stack name follows pattern: {appName}-{environment}
const stack = new Stack(app, 'primary-care-finder-' + environment, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: 'primary-care-finder-' + environment,
})

const certificateARN = app.node.tryGetContext('certificateARN') as string | undefined
const certificate = certificateARN
  ? acm.Certificate.fromCertificateArn(stack, 'FrontendCert', certificateARN)
  : undefined

const frontendDomain = app.node.tryGetContext('frontendDomain') as string | undefined
let frontendZone: route53.IHostedZone | undefined
if (frontendDomain && certificate) {
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

// Scope as any so linked @phila/constructs resolves to a single Construct type at runtime.
new StaticSite(stack, 'primary-care-finderSite', {
  ...context,
  assetDir: '../frontend/dist',
  ...(certificate ? { certificate } : {}),
  ...(frontendZone ? { hostedZone: frontendZone } : {}),
})

applyStandardTags(app, context)
applyNagChecks(app)

app.synth()
