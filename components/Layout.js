import { useState } from 'react';
import Link from 'next/link';
import styles from '../styles/Layout.module.css';

export default function Layout({ children }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <nav className={styles.nav}>
                <button
                    className={styles.menuToggle}
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle menu"
                >
                    ☰
                </button>

                <div className={`${styles.navLinks} ${menuOpen ? styles.open : ''}`}>
                    <Link href="/" className={styles.navLink} onClick={() => setMenuOpen(false)}>Trade Calculator</Link>
                    <Link href="/rankings" className={styles.navLink} onClick={() => setMenuOpen(false)}>Rankings</Link>
                    <Link href="/my-team" className={styles.navLink} onClick={() => setMenuOpen(false)}>My Team</Link>
                </div>
            </nav>

            <main className={styles.mainContent}>
                {children}
            </main>
        </>
    );
}
