import React from "react";
import styles from "./Farm.module.css";

/**
 * Plantio — listar e criar plantios (reusa estrutura leve)
 */
export function Plantio() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Plantio</h1>
        <p>Registre e acompanhe plantios por talhão</p>
      </header>

      <div className={styles.list}>
        <div className={styles.listItem}>
          <div>
            <strong>Plantio Exemplo</strong>
            <div className={styles.meta}>
              <span>Variedade: Híbrido X</span>
              <span>Área: 2.5 ha</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Colheita — registrar colheitas e rendimentos
 */
export function Colheita() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Colheita</h1>
        <p>Registre colheitas, rendimentos e observações</p>
      </header>

      <div className={styles.list}>
        <div className={styles.listItem}>
          <div>
            <strong>Colheita Exemplo</strong>
            <div className={styles.meta}>
              <span>Prod: Milho</span>
              <span>Rendimento: 2.300 kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pecuária — gerenciamento de rebanho, reprodução e venda
 */
export function Pecuaria() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Pecuária</h1>
        <p>Controle de rebanho, fichas e histórico sanitário</p>
      </header>

      <div className={styles.list}>
        <div className={styles.listItem}>
          <div>
            <strong>Vaca Exemplo</strong>
            <div className={styles.meta}>
              <span>Tag: COW-001</span>
              <span>Status: ACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Piscicultura — tanques, estoques e safras de peixes
 */
export function Piscicultura() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Piscicultura</h1>
        <p>Gestão de tanques, estoques e ciclos de criação</p>
      </header>

      <div className={styles.list}>
        <div className={styles.listItem}>
          <div>
            <strong>Tanque 1</strong>
            <div className={styles.meta}>
              <span>Espécie: Tilápia</span>
              <span>Biomassa: 120 kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Granja — galpões, postura e logística de ovos/aves
 */
export function Granja() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Granja</h1>
        <p>Gerencie lotes de postura, ração e produção</p>
      </header>

      <div className={styles.list}>
        <div className={styles.listItem}>
          <div>
            <strong>Lote Postura A</strong>
            <div className={styles.meta}>
              <span>Produção diária: 120 dúzias</span>
              <span>Status: Estável</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}