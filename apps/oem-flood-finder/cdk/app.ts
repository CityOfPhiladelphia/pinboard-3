#!/usr/bin/env node
import 'source-map-support/register'
import { App, Aspects, Stack } from 'aws-cdk-lib'
import { AwsSolutionsChecks, NIST80053R5Checks } from 'cdk-nag'
import { StaticSite, Confidentiality, Environment } from '@phila/constructs'

const app = new App()

// Environment is determined by CDK context
const environment = app.node.tryGetContext('environment') as Environment

if (!environment) {
  throw new Error(
    'Environment must be specified via context. Use: cdk deploy -c environment=dev'
  )
}

// Read compliance frameworks from context
const compliance = app.node.tryGetContext('compliance')
const complianceFrameworks = compliance ? compliance.split(',') : []

// Application context with governance metadata
const context = {
  appName: 'oem-flood-finder',
  environment,
  department: '4-oit',
  team: 'Software Engineering',
  contact: 'andy.rothwell@phila.gov',
  compliance: complianceFrameworks,
  confidentiality: Confidentiality.LOW,
}

// Stack name follows pattern: {appName}-{environment}
const stack = new Stack(app, 'oem-flood-finder-' + environment, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  stackName: 'oem-flood-finder-' + environment,
})

// Scope as any so linked @phila/constructs resolves to a single Construct type at runtime.
new StaticSite(stack as any, 'oem-flood-finderSite', {
  ...context,
  assetDir: '../frontend/dist',
})

// Apply compliance checks
Aspects.of(app).add(new NIST80053R5Checks({ verbose: true }))
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

app.synth()
