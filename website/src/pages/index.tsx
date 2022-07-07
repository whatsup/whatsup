import React from 'react'
import clsx from 'clsx'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import HomepageFeatures from '@site/src/components/HomepageFeatures'

import styles from './index.module.css'

import Logo from '@site/static/img/logo_big.svg'
import Github from '@site/static/img/github.svg'

function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext()
    return (
        <header className={clsx('hero hero--primary', styles.heroBanner)}>
            <div className="container">
                <h1 className="hero__title">{siteConfig.title}</h1>
                <p className="hero__subtitle">{siteConfig.tagline}</p>
                <div className={styles.buttons}>
                    <Link className="button button--secondary button--lg" to="/docs/intro">
                        Docusaurus Tutorial - 5min ⏱️
                    </Link>
                </div>
            </div>
        </header>
    )
}

export default function Home(): JSX.Element {
    const { siteConfig } = useDocusaurusContext()
    return (
        <main className={styles.main}>
            <Logo role="img" />
            <a className={styles.github} href="https://github.com/whatsup/whatsup" target="_blank">
                <Github />
            </a>
            <h1 className={styles.title}>whatsup</h1>
            <p className={styles.subtitle}>A frontend framework for chillout-mode development 🥤</p>
            <a className="button button--primary button--lg" href="/docs/intro">
                Get Started
            </a>
        </main>
    )
}
