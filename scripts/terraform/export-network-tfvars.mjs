#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const networkStackDir = resolve(repoRoot, 'infra', 'terraform', 'stacks', 'network');
const rootTfvarsPath = resolve(repoRoot, 'infra', 'terraform', 'network.auto.tfvars.json');

const output = JSON.parse(execFileSync('terraform', ['output', '-json'], {
  cwd: networkStackDir,
  encoding: 'utf8'
}));

const tfvars = {
  provision_network: false,
  vpc_id: output.vpc_id.value,
  public_subnet_ids: output.public_subnet_ids.value,
  private_subnet_ids: output.private_subnet_ids.value
};

writeFileSync(rootTfvarsPath, `${JSON.stringify(tfvars, null, 2)}\n`);
console.log(`Wrote ${rootTfvarsPath}`);
