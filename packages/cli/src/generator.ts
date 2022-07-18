import { sync as spawnSync } from 'cross-spawn'
import fs from 'fs'
import path from 'path'
import ncu from 'npm-check-updates'
import { logger } from './logger'

export interface Options {
    projectName: string
}

export const generator = async (options: Options) => {
    const { projectName } = options

    const src = path.join(__dirname, '../src/template')
    const dest = path.join(process.cwd(), projectName)

    logger.blue(`Creating project "${projectName}"`)

    try {
        logger.info('Scaffolding...')

        copyTemplate(src, dest)

        injectProjectName(projectName, path.join(dest, 'package.json'))
        injectProjectName(projectName, path.join(dest, 'webpack.config.js'))
        injectProjectName(projectName, path.join(dest, 'readme.md'))

        logger.success('Scaffolding')
    } catch (e) {
        logger.failure('Scaffolding')
        return
    }

    try {
        logger.info('Upgrade packages versions...')

        await upgradePackageVersions(dest)

        logger.success('Upgrade packages versions')
    } catch (e) {
        logger.failure('Upgrade packages versions')
    }

    try {
        logger.info('Initialize git repository...')

        initGitRepository(dest)

        logger.success('Initialize git repository')
    } catch (e) {
        logger.failure('Initialize git repository')
    }

    try {
        logger.info('Install dependencies...')

        installDependencies(dest)

        logger.success('Install dependencies')
    } catch (e) {
        logger.failure('Install dependencies')
    }

    logger.green(`Project "${projectName}" created!`)

    try {
        logger.blue(`Starting project "${projectName}"`)

        start(dest)
    } catch (e) {
        logger.red(`Error starting project`)
        logger.log(`Please run it manually:`)
        logger.log(`cd ./${projectName}`)
        logger.log(`npm start`)
    }
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

    fs.writeFileSync(path.join(projectDir, '.gitignore'), 'node_modules\ndist')

    spawnSync('git', ['init'], { stdio: 'ignore' })
    spawnSync('git', ['add', '*'], { stdio: 'ignore' })
    spawnSync('git', ['commit', '-m', 'initial'], { stdio: 'ignore' })

    process.chdir(origin)
}

const installDependencies = (projectDir: string) => {
    const origin = process.cwd()

    process.chdir(projectDir)

    spawnSync('npm', ['install'], { stdio: 'inherit' })

    process.chdir(origin)
}

const start = (projectDir: string) => {
    const origin = process.cwd()

    process.chdir(projectDir)

    spawnSync('npm', ['start'], { stdio: 'inherit' })

    process.chdir(origin)
}
