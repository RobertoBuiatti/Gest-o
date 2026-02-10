import { useState, useEffect } from "react";
import styles from "./SystemStatus.module.css";

export function SystemStatus() {
	const [latency, setLatency] = useState(24);
	const [memory, setMemory] = useState(45);

	useEffect(() => {
		const interval = setInterval(() => {
			setLatency((prev) =>
				Math.max(10, Math.min(100, prev + (Math.random() * 20 - 10))),
			);
			setMemory((prev) =>
				Math.max(30, Math.min(80, prev + (Math.random() * 10 - 5))),
			);
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	return (
		<div className={styles.widget}>
			<div className={styles.header}>
				<div className={styles.title}>
					<span className={styles.blink}></span>
					SYSTEM STATUS :: ONLINE
				</div>
				<div style={{ fontSize: "0.7em", color: "var(--text-muted)" }}>
					UPTIME: 42h 12m
				</div>
			</div>

			<div className={styles.statusGrid}>
				<div className={styles.statusItem}>
					<span className={styles.label}>SERVER LATENCY</span>
					<span
						className={`${styles.value} ${latency < 50 ? styles.online : styles.warning}`}
					>
						{latency.toFixed(0)}ms
					</span>
				</div>

				<div className={styles.statusItem}>
					<span className={styles.label}>MEMORY LOAD</span>
					<span className={styles.value}>{memory.toFixed(1)}%</span>
				</div>

				<div className={styles.statusItem}>
					<span className={styles.label}>NEXUS LINK</span>
					<span className={`${styles.value} ${styles.online}`}>
						CONNECTED
					</span>
				</div>

				<div className={styles.statusItem}>
					<span className={styles.label}>SECURITY</span>
					<span className={`${styles.value} ${styles.online}`}>
						ENCRYPTED
					</span>
				</div>
			</div>
		</div>
	);
}
