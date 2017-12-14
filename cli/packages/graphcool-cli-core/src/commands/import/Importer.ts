import * as path from 'path'
import * as fs from 'fs-extra'
import { Client, Output } from 'graphcool-cli-engine'
import * as globby from 'globby'
import { Validator } from './Validator'
import chalk from 'chalk'

export interface Files {
  lists: string[]
  nodes: string[]
  relations: string[]
}

export class Importer {
  importPath: string
  client: Client
  types: string
  out: Output
  constructor(importPath: string, types: string, client: Client, out: Output) {
    if (!fs.pathExistsSync(importPath)) {
      throw new Error(`Import path ${importPath} does not exist`)
    }
    this.importPath = importPath
    this.client = client
    this.types = types
    this.out = out
  }
  async upload(projectId: string) {
    let before = Date.now()
    this.out.action.start('Validating data')
    const files = this.getFiles()
    this.validateFiles(files)
    this.out.action.stop(chalk.cyan(`${Date.now() - before}ms`))
    before = Date.now()
    this.out.action.start('Uploading nodes')
    for (const fileName of files.nodes) {
      const file = fs.readFileSync(fileName, 'utf-8')
      const json = JSON.parse(file)
      const result = await this.client.upload(projectId, file)
      if (result.length > 0) {
        this.out.log(this.out.getStyledJSON(result))
        this.out.exit(1)
      }
    }
    this.out.action.stop(chalk.cyan(`${Date.now() - before}ms`))
    before = Date.now()
    this.out.action.start('Uploading lists')
    for (const fileName of files.lists) {
      const file = fs.readFileSync(fileName, 'utf-8')
      const json = JSON.parse(file)
      const result = await this.client.upload(projectId, file)
      if (result.length > 0) {
        this.out.log(this.out.getStyledJSON(result))
        this.out.exit(1)
      }
    }
    this.out.action.stop(chalk.cyan(`${Date.now() - before}ms`))
    before = Date.now()
    this.out.action.start('Uploading relations')
    for (const fileName of files.relations) {
      const file = fs.readFileSync(fileName, 'utf-8')
      const json = JSON.parse(file)
      const result = await this.client.upload(projectId, file)
      if (result.length > 0) {
        this.out.log(this.out.getStyledJSON(result))
        this.out.exit(1)
      }
    }
    this.out.action.stop(chalk.cyan(`${Date.now() - before}ms`))
  }

  validateFiles(files: Files) {
    const validator = new Validator(this.types)
    for (const fileName of files.nodes) {
      const file = fs.readFileSync(fileName, 'utf-8')
      const json = JSON.parse(file)
      validator.validateImportData(json)
    }
    for (const fileName of files.lists) {
      const file = fs.readFileSync(fileName, 'utf-8')
      const json = JSON.parse(file)
      validator.validateImportData(json)
    }
    for (const fileName of files.relations) {
      const file = fs.readFileSync(fileName, 'utf-8')
      const json = JSON.parse(file)
      validator.validateImportData(json)
    }
  }

  getFiles(): Files {
    return {
      lists: globby
        .sync('*.json', {
          cwd: path.join(this.importPath, 'lists/'),
        })
        .map(p => path.join(this.importPath, 'lists/', p)),
      nodes: globby
        .sync('*.json', {
          cwd: path.join(this.importPath, 'nodes/'),
        })
        .map(p => path.join(this.importPath, 'nodes/', p)),
      relations: globby
        .sync('*.json', {
          cwd: path.join(this.importPath, 'relations/'),
        })
        .map(p => path.join(this.importPath, 'relations/', p)),
    }
  }
}