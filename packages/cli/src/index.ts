import { program } from 'commander'
import inquirer from 'inquirer'
import { logger } from './logger'
import { generator } from './generator'

program
    .name('whatsup')
    .command('create')
    .argument('[projectName]', 'Project name')
    .action((projectName?: string) => {
        logger.title()

        if (projectName) {
            generator({ projectName })
        } else {
            inquirer
                .prompt([
                    {
                        name: 'projectName',
                        message: 'Enter Project Name:',
                        type: 'string',
                        default: 'my-project',
                    },
                ])
                .then(generator)
        }
    })

program.parse(process.argv)
