import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api";
import styles from "./Farm.module.css";

type FarmProduct = {
  id: string;
  farmId?: string;
  name: string;
  description?: string;
  salePrice: number;
  quantityInStock: number;
  isActive: boolean;
};

type Crop = {
  id: string;
  farmId?: string;
  name: string;
  variety?: string;
  area?: number;
  plantedAt?: string;
  harvestedAt?: string | null;
  expectedYield?: number;
};

type Animal = {
  id: string;
  farmId?: string;
  name?: string;
  tag?: string;
  type: string;
  birthDate?: string;
  status: string;
};

export function FarmDashboard() {
  const { data: products } = useQuery<FarmProduct[]>({
    queryKey: ["farm-products"],
    queryFn: async () => (await api.get("/farm/products")).data,
  });

  const { data: crops } = useQuery<Crop[]>({
    queryKey: ["farm-crops"],
    queryFn: async () => (await api.get("/farm/crops")).data,
  });

  const { data: animals } = useQuery<Animal[]>({
    queryKey: ["farm-animals"],
    queryFn: async () => (await api.get("/farm/animals")).data,
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Fazenda</h1>
        <p>Visão geral — produtos, cultivos e animais</p>
      </header>

      <section className={styles.grid}>
        <div className={styles.card}>
          <h3>Produtos</h3>
          <p className={styles.bigNumber}>{products?.length ?? 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Cultivos</h3>
          <p className={styles.bigNumber}>{crops?.length ?? 0}</p>
        </div>
        <div className={styles.card}>
          <h3>Animais</h3>
          <p className={styles.bigNumber}>{animals?.length ?? 0}</p>
        </div>
      </section>
    </div>
  );
}

export function FarmProducts() {
  const queryClient = useQueryClient();
  const { data: products } = useQuery<FarmProduct[]>({
    queryKey: ["farm-products"],
    queryFn: async () => (await api.get("/farm/products")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<FarmProduct>) =>
      (await api.post("/farm/products", payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farm-products"] }),
  });

  const sellMutation = useMutation({
    mutationFn: async ({ id, quantity, unitPrice }: any) =>
      (await api.post(`/farm/products/${id}/sell`, { quantity, unitPrice })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farm-products"] }),
  });

  const [newName, setNewName] = useState("");
  const [price, setPrice] = useState("");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Produtos da Fazenda</h1>
        <p>Gerencie estoque e vendas de produtos rurais</p>
      </header>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({
            name: newName,
            salePrice: Number(price || 0),
            farmId: "", // preencher conforme necessidade
          });
          setNewName("");
          setPrice("");
        }}
      >
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nome do produto" />
        <input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Preço" type="number" step="0.01" />
        <button type="submit" disabled={createMutation.isPending}>Criar</button>
      </form>

      <div className={styles.list}>
        {products?.map((p) => (
          <div key={p.id} className={styles.listItem}>
            <div>
              <strong>{p.name}</strong>
              <div className={styles.meta}>
                <span>R$ {p.salePrice.toFixed(2)}</span>
                <span>Estoque: {p.quantityInStock}</span>
              </div>
            </div>
            <div className={styles.actions}>
              <button onClick={() => sellMutation.mutate({ id: p.id, quantity: 1, unitPrice: p.salePrice })}>
                Vender 1
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FarmCrops() {
  const queryClient = useQueryClient();
  const { data: crops } = useQuery<Crop[]>({
    queryKey: ["farm-crops"],
    queryFn: async () => (await api.get("/farm/crops")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Crop>) => (await api.post("/farm/crops", payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farm-crops"] }),
  });

  const [name, setName] = useState("");
  const [area, setArea] = useState("");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Cultivos</h1>
        <p>Gerencie plantios e colheitas</p>
      </header>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({
            name,
            area: Number(area || 0),
            farmId: "", // preencher conforme necessidade
          });
          setName("");
          setArea("");
        }}
      >
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do cultivo" />
        <input value={area} onChange={(e) => setArea(e.target.value)} placeholder="Área (ha)" type="number" step="0.01" />
        <button type="submit" disabled={createMutation.isPending}>Criar Lote</button>
      </form>

      <div className={styles.list}>
        {crops?.map((c) => (
          <div key={c.id} className={styles.listItem}>
            <div>
              <strong>{c.name}</strong>
              <div className={styles.meta}>
                <span>Variedade: {c.variety}</span>
                <span>Área: {c.area ?? "-" } ha</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FarmAnimals() {
  const queryClient = useQueryClient();
  const { data: animals } = useQuery<Animal[]>({
    queryKey: ["farm-animals"],
    queryFn: async () => (await api.get("/farm/animals")).data,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Animal>) => (await api.post("/farm/animals", payload)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["farm-animals"] }),
  });

  const [type, setType] = useState("");
  const [tag, setTag] = useState("");

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Animais</h1>
        <p>Cadastre e gerencie o rebanho</p>
      </header>

      <form
        className={styles.form}
        onSubmit={(e) => {
          e.preventDefault();
          createMutation.mutate({
            type,
            tag,
            farmId: "", // ajustar se necessário
          });
          setType("");
          setTag("");
        }}
      >
        <input value={type} onChange={(e) => setType(e.target.value)} placeholder="Tipo (ex: COW)" />
        <input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="Tag (opcional)" />
        <button type="submit" disabled={createMutation.isPending}>Adicionar Animal</button>
      </form>

      <div className={styles.list}>
        {animals?.map((a) => (
          <div key={a.id} className={styles.listItem}>
            <div>
              <strong>{a.name || a.tag || a.type}</strong>
              <div className={styles.meta}>
                <span>Tipo: {a.type}</span>
                <span>Status: {a.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}