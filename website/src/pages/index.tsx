import React from 'react'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

import styles from './index.module.css'

import Logo from '@site/static/img/logo_big.svg'
import Github from '@site/static/img/github.svg'

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext()
    return (
        <main className={styles.main}>
            <Logo role="img" />
            <a
                className={styles.github}
                href="https://github.com/whatsup/whatsup"
                target="_blank"
            >
                <Github />
            </a>
            <h1 className={styles.title}>whatsup</h1>
            <p className={styles.subtitle}>
                A frontend framework for chillout-mode development 🥤
            </p>
            <a className="button button--primary button--lg" href="/docs/intro">
                Get Started
            </a>
        </main>
    )
}
