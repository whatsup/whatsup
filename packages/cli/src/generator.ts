import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import ncu from 'npm-check-updates'
import { logger } from './logger'
import inquirer from 'inquirer'

export interface Options {
    projectName: string
}

export const generator = async (options: Options) => {
    const { projectName } = options

    const src = path.join(__dirname, '../src/template')
    const dest = path.join(process.cwd(), projectName)

    logger.blue(`Creating project "${projectName}"`)

    logger.start('Scaffolding...')

    copyTemplate(src, dest)

    injectProjectName(projectName, path.join(dest, 'package.json'))
    injectProjectName(projectName, path.join(dest, 'webpack.config.js'))
    injectProjectName(projectName, path.join(dest, 'readme.md'))

    logger.end('Scaffolding')
    logger.start('Upgrade packages versions...')

    await upgradePackageVersions(dest)

    logger.end('Upgrade packages versions')
    logger.start('Initialize git repository...')

    initGitRepository(dest)

    logger.end('Initialize git repository')
    logger.start('Install dependencies...')

    installDependencies(dest)

    logger.end('Install dependencies')

    logger.green(`Project "${projectName}" created!`)

    logger.blue(`Starting project "${projectName}"`)

    start(dest)
}

const injectProjectName = (projectName: string, filePath: string) => {
    const buffer = fs.readFileSync(filePath, { encoding: 'utf8' })
    const content = buffer.toString().replace('<% projectName %>', projectName)

    fs.writeFileSync(filePath, content)
}

const copyTemplate = (src: string, dest: string) => {
    fs.mkdirSync(dest, { recursive: true })

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name)
        const destPath = path.join(dest, entry.name)

        if (entry.isDirectory()) {
            copyTemplate(srcPath, destPath)
        } else {
            fs.copyFileSync(srcPath, destPath)
        }
    }
}

const upgradePackageVersions = async (projectDir: string) => {
    const packageFile = path.join(projectDir, 'package.json')

    await ncu({
        packageFile,
        filter: /whatsup/,
        upgrade: true,
    })
}

const initGitRepository = (projectDir: string) => {
    const origin = process.cwd()

    process.chdir(projectDir)

    spawnSync('git', ['init'], { stdio: 'ignore' })
    spawnSync('git', ['add', '*'], { stdio: 'ignore' })
    spawnSync('git', ['commit', '-m', 'initial'], { stdio: 'ignore' })

    process.chdir(origin)
}

const installDependencies = (projectDir: string) => {
    const origin = process.cwd()

    process.chdir(projectDir)

    spawnSync('npm', ['install'], { stdio: 'ignore' })

    process.chdir(origin)
}

const start = (projectDir: string) => {
    const origin = process.cwd()

    process.chdir(projectDir)

    spawnSync('npm', ['start'], { stdio: 'inherit' })

    process.chdir(origin)
}
